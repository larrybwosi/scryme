import {
  FulfillmentType,
  PaymentStatus,
  TransactionType,
  TransactionStatus,
  FulfillmentStatus,
  AllocationStatus,
  PaymentMethod,
  prisma as db,
  Prisma,
} from "@repo/db";
import {
  ProcessSaleInput,
  ProcessSaleResult,
  TransactionWithDetails,
  ProcessSaleInputSchema,
} from "../../lib/validations/sale";

import { navariService } from "../../lib/services/navari.service";
import { unitCalculationService } from "../../lib/services/unit-calculation.service";
import { realtimeService } from "../../realtime";

// ==========================================
// HELPER: TAX & COMPLIANCE CALCULATOR
// ==========================================
/**
 * Handles tax fetching, inclusive tax back-calculation, discount validation,
 * and financial summary generation.
 */
async function calculateTaxAndCompliance(
  tx: Prisma.TransactionClient,
  organizationId: string,
  subtotal: Prisma.Decimal,
  discountAmount: number | null | undefined,
  taxIds: string[] | undefined,
) {
  // 1. Fetch Applicable Taxes
  const applicableTaxes = await tx.taxRate.findMany({
    where: {
      id: { in: taxIds && taxIds.length > 0 ? taxIds : undefined },
      isDefault: taxIds && taxIds.length > 0 ? undefined : true,
      organizationId,
      isActive: true,
    },
    select: { id: true, name: true, rate: true },
  });

  // 2. Validate Discount
  const transactionDiscount = new Prisma.Decimal(discountAmount ?? 0);
  if (transactionDiscount.greaterThan(subtotal)) {
    throw new Error(
      `Discount (${transactionDiscount.toFixed(2)}) cannot exceed subtotal (${subtotal.toFixed(2)}).`,
    );
  }

  // 3. Calculate Totals (Inclusive Tax Logic)
  // Logic: Final = Subtotal - Discount. Tax is extracted from this Final amount.
  const finalAmount = subtotal.sub(transactionDiscount);

  const totalTaxRate = applicableTaxes.reduce(
    (sum, tax) => sum.add(tax.rate),
    new Prisma.Decimal(0),
  );

  // Back-calculate the pre-tax amount: Amount / (1 + Rate)
  const totalAmountBeforeTax = totalTaxRate.gt(0)
    ? finalAmount
        .div(new Prisma.Decimal(1).add(totalTaxRate))
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    : finalAmount;

  const totalCalculatedTax = finalAmount.sub(totalAmountBeforeTax);

  // 4. Generate Tax Breakdown for DB Creation
  const taxBreakdown = applicableTaxes.map((tax) => ({
    taxRateId: tax.id,
    name: tax.name,
    rate: tax.rate,
    amount: totalAmountBeforeTax
      .mul(tax.rate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
  }));

  return {
    discountTotal: transactionDiscount,
    taxTotal: totalCalculatedTax,
    subtotalBeforeTax: totalAmountBeforeTax, // The taxable base
    finalTotal: finalAmount, // The amount the customer actually pays
    taxBreakdown,
  };
}

// ==========================================
// MAIN FUNCTION: PROCESS SALE
// ==========================================

export async function processSale(
  organizationId: string,
  memberId: string | null | undefined,
  inputData: unknown,
): Promise<ProcessSaleResult> {
  let subtotalBeforeTax: Prisma.Decimal = new Prisma.Decimal(0);
  let taxTotal: Prisma.Decimal = new Prisma.Decimal(0);

  // 1. Input Validation
  const validation = ProcessSaleInputSchema.safeParse(inputData);
  if (!validation.success) {
    const flatErrors = validation.error.flatten();
    console.error("POS Sale Input Validation Failed:", {
      errors: flatErrors.fieldErrors,
      inputData: JSON.stringify(inputData),
    });
    return {
      success: false,
      message: "Invalid sale data provided. Please check the fields.",
    };
  }

  const validatedData = validation.data;
  const {
    cartItems,
    locationId,
    customerId,
    businessAccountId,
    payments,
    discountAmount,
    notes,
    enableStockTracking,
    taxIds,
    saleNumber,
    saleDate,
    isWholesale = false,
    taxIntegrationEnabled: inputTaxIntegrationEnabled,
    country: inputCountry,
  } = validatedData;

  try {
    const orgData = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        settings: true,
      },
    });

    const allowNegativeStock = orgData?.settings?.negativeStock ?? false;
    const inventoryPolicy = orgData?.settings?.inventoryPolicy ?? "FEFO";
    const baseCurrency = orgData?.settings?.defaultCurrency ?? "USD";
    const taxIntegrationEnabled =
      inputTaxIntegrationEnabled ??
      orgData?.settings?.taxIntegrationEnabled ??
      false;
    const country = inputCountry ?? orgData?.settings?.country ?? "Kenya";
    const highValueThreshold =
      orgData?.settings?.highValueTaxThreshold ?? new Prisma.Decimal(100000);

    const result = await db.$transaction(
      async (tx) => {
        // --- 1. Pre-fetch variant data ---
        const variantIds = cartItems.map((item) => item.variantId);

        // --- 1. ENTERPRISE PRICING ENGINE: Fetch Price Lists & Variants ---
        const now = new Date();
        const [allVariants, activePriceLists] = await Promise.all([
          tx.productVariant.findMany({
            where: {
              id: { in: variantIds },
              isActive: true,
              product: { isActive: true, organizationId },
            },
            include: {
              product: {
                select: { id: true, name: true, organizationId: true },
              },
              sellingUnits: {
                where: { isActive: true },
              },
            },
          }),
          tx.priceList.findMany({
            where: {
              organizationId,
              isActive: true,
              AND: [
                { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
                { OR: [{ validTo: null }, { validTo: { gte: now } }] },
              ],
              OR: [
                { isGlobal: true },
                ...(customerId
                  ? [{ customers: { some: { id: customerId } } }]
                  : []),
                ...(businessAccountId
                  ? [{ businessAccounts: { some: { id: businessAccountId } } }]
                  : []),
              ],
            },
            orderBy: { priority: "desc" },
            include: {
              items: {
                where: {
                  variantId: { in: variantIds },
                  isActive: true,
                  deletedAt: null,
                },
              },
            },
          }),
        ]);
        const variantsMap = new Map(allVariants.map((v) => [v.id, v]));

        // --- 2. Line Items & Stock Logic ---
        let transactionSubTotal = new Prisma.Decimal(0);
        const transactionItemsCreateData: any[] =
          [];
        const variantStockUpdates = new Map<string, number>();

        for (const item of cartItems) {
          const variant = variantsMap.get(item.variantId);
          if (!variant) {
            throw new Error(
              `Product variant ID ${item.variantId} is invalid, inactive, or not part of this organization.`,
            );
          }

          // A. Resolve Price using Service
          const { price: resolvedPrice, defaultPrice } =
            await unitCalculationService.resolvePrice({
              variantId: item.variantId,
              sellingUnitId: item.sellingUnitId,
              quantity: item.quantity,
              customerId,
              businessAccountId,
              organizationId,
              isWholesale,
              tx,
              preFetchedVariant: variant,
              preFetchedPriceLists: activePriceLists,
            });

          // B. Calculate Line Totals
          const itemTotal = resolvedPrice.mul(item.quantity);
          transactionSubTotal = transactionSubTotal.add(itemTotal);

          // C. Stock Allocation using Service
          let unitCost = new Prisma.Decimal(variant.buyingPrice ?? 0);
          const allocationsCreateData: any[] =
            [];

          if (enableStockTracking) {
            const selectedSellingUnit = item.sellingUnitId
              ? variant.sellingUnits.find(
                  (u: any) => u.id === item.sellingUnitId,
                )
              : null;
            const conversionMultiplier =
              selectedSellingUnit?.conversionMultiplier
                ? selectedSellingUnit.conversionMultiplier.toNumber()
                : 1;

            const allocationResult =
              await unitCalculationService.calculateStockAllocation({
                tx,
                variantId: item.variantId,
                locationId,
                organizationId,
                quantityToFulfill: item.quantity,
                conversionMultiplier,
                inventoryPolicy: inventoryPolicy as any,
                allowNegativeStock,
                buyingPrice: variant.buyingPrice as unknown as Prisma.Decimal,
                productName: variant.product.name,
                variantName: variant.name,
              });

            allocationsCreateData.push(...allocationResult.allocations);
            unitCost = new Prisma.Decimal(
              allocationResult.unitCost as unknown as Prisma.Decimal,
            );

            const currentVariantStockUpdate =
              variantStockUpdates.get(item.variantId) ?? 0;
            variantStockUpdates.set(
              item.variantId,
              currentVariantStockUpdate + allocationResult.stockDeductionTotal,
            );
          }

          transactionItemsCreateData.push({
            variant: { connect: { id: variant.id } },
            productName: variant.product.name,
            variantName: variant.name,
            sku: variant.sku ?? "N/A",
            quantity: item.quantity,
            listPrice: defaultPrice as unknown as Prisma.Decimal,
            unitPrice: resolvedPrice as unknown as Prisma.Decimal,
            unitCost: unitCost,
            subtotal: itemTotal,
            discountAmount: new Prisma.Decimal(0),
            taxAmount: new Prisma.Decimal(0),
            lineTotal: itemTotal,
            sellingUnit: item.sellingUnitId
              ? { connect: { id: item.sellingUnitId } }
              : undefined,
            stockAllocations: { create: allocationsCreateData },
          });
        }

        // --- 4. Tax & Compliance Calculation (Extracted Function) ---
        let finalTotal: Prisma.Decimal;
        let discountTotal: Prisma.Decimal;
        let taxBreakdown: any[];

        ({
          finalTotal,
          taxTotal,
          discountTotal,
          subtotalBeforeTax,
          taxBreakdown,
        } = await calculateTaxAndCompliance(
          tx,
          organizationId,
          transactionSubTotal,
          discountAmount,
          taxIds,
        ));

        // --- 5. Payment Logic ---
        const paymentRecordsCreateData: any[] =
          [];
        let totalPaidAmount = new Prisma.Decimal(0);

        for (const paymentSplit of payments) {
          const splitAmount = new Prisma.Decimal(paymentSplit.amount);
          let splitStatus: PaymentStatus = PaymentStatus.COMPLETED;

          // M-Pesa STK Pushes are initially PENDING
          if (
            paymentSplit.method === PaymentMethod.MPESA &&
            paymentSplit.mpesaFlowType === "STK_PUSH"
          ) {
            splitStatus = PaymentStatus.PENDING;
          }

          // Only add to "Paid" total if the status is immediately COMPLETED
          if (splitStatus === PaymentStatus.COMPLETED) {
            totalPaidAmount = totalPaidAmount.add(splitAmount);
          }

          const splitReceived = paymentSplit.amountReceived
            ? new Prisma.Decimal(paymentSplit.amountReceived)
            : splitAmount;
          const splitChange = paymentSplit.change
            ? new Prisma.Decimal(paymentSplit.change)
            : new Prisma.Decimal(0);

          paymentRecordsCreateData.push({
            method: paymentSplit.method,
            status: splitStatus,
            amount: splitAmount,
            amountReceived: splitReceived,
            change: splitChange,
            referenceNumber: paymentSplit.reference || null,
            payerPhone: paymentSplit.mpesaPhoneNumber || null,
            processedAt:
              splitStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
          });

          // Link to unclaimed payment if reference is provided
          if (paymentSplit.method === PaymentMethod.MPESA && paymentSplit.reference) {
            const unclaimed = await tx.unclaimedPayment.findUnique({
              where: { transId: paymentSplit.reference },
            });

            if (unclaimed && !unclaimed.claimed) {
              await tx.unclaimedPayment.update({
                where: { id: unclaimed.id },
                data: {
                  claimed: true,
                  claimedAt: new Date(),
                  claimedByUserId: memberId || 'system',
                },
              });
            }
          }
        }

        // --- 6. Transaction Status ---
        let overallPaymentStatus: PaymentStatus = PaymentStatus.PENDING;

        if (finalTotal.equals(0)) {
          overallPaymentStatus = PaymentStatus.COMPLETED;
        } else if (totalPaidAmount.greaterThanOrEqualTo(finalTotal)) {
          overallPaymentStatus = PaymentStatus.COMPLETED;
        } else if (totalPaidAmount.greaterThan(0)) {
          overallPaymentStatus = PaymentStatus.PARTIALLY_PAID;
        } else {
          // No payments completed yet (e.g. only STK push pending)
          overallPaymentStatus = PaymentStatus.PENDING;
        }

        // --- 7. Create Transaction ---
        const newTransactionNumber =
          saleNumber ||
          `SALE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const transactionDate = saleDate || new Date();

        // Transaction is considered "Complete" operationally if full payment is received
        // or if you allow credit (but for POS_SALE, usually requires payment)
        const isCompleted = overallPaymentStatus === PaymentStatus.COMPLETED;

        const newTransaction = await tx.transaction.create({
          data: {
            number: newTransactionNumber,
            type: TransactionType.POS_SALE,
            status: isCompleted
              ? TransactionStatus.COMPLETED
              : TransactionStatus.PENDING_CONFIRMATION,
            organizationId,
            memberId,
            customerId,
            businessAccountId,
            locationId,
            paymentStatus: overallPaymentStatus,
            totalPaid: totalPaidAmount,
            subtotal: subtotalBeforeTax, // Storing the taxable base here
            discountTotal: discountTotal,
            taxTotal: taxTotal,
            shippingTotal: 0,
            finalTotal: finalTotal,
            currencyCode: baseCurrency,
            exchangeRate: 1,
            baseCurrencyTotal: finalTotal,
            createdAt: transactionDate,
            confirmedAt: isCompleted ? transactionDate : undefined,
            completedAt: isCompleted ? transactionDate : undefined,
            notes,
            items: { create: transactionItemsCreateData },
            taxes: { create: taxBreakdown },
            payments: { create: paymentRecordsCreateData },
          },
          include: {
            items: {
              include: {
                variant: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    product: {
                      select: {
                        id: true,
                        name: true,
                        category: { select: { name: true } },
                      },
                    },
                  },
                },
                stockAllocations: {
                  include: {
                    stockBatch: { select: { id: true, batchNumber: true } },
                  },
                },
              },
            },
            customer: true,
            businessAccount: true,
            member: { select: { id: true, user: { select: { name: true } } } },
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                settings: { select: { defaultCurrency: true } },
              },
            },
            location: { select: { id: true, name: true } },
            taxes: {
              include: {
                taxRate: { select: { id: true, name: true, rate: true } },
              },
            },
            payments: true,
          },
        });

        // --- 8. Navari/KRA Compliance ---
        if (taxIntegrationEnabled && country === "Kenya") {
          const isHighValue =
            finalTotal.greaterThanOrEqualTo(highValueThreshold);
          const forceOverride =
            (validatedData as any).forceTaxOverride === true;

          const executeKRACompliance = async (isBlocking: boolean) => {
            try {
              const customer = customerId
                ? await db.customer.findUnique({ where: { id: customerId } })
                : null;
              const kraPin = customer?.taxId || "A000000000X";

              await navariService.generateETRInvoice(organizationId, {
                invoiceId: newTransaction.id,
                kraPin,
                netTotal: subtotalBeforeTax.toNumber(),
                totalTaxes: taxTotal.toNumber(),
                items: newTransaction.items.map((item) => ({
                  itemCode: item.sku,
                  quantity: item.quantity,
                  rate: item.unitPrice.toNumber(),
                })),
              });

              await tx.transaction.update({
                where: { id: newTransaction.id },
                data: {
                  metadata: {
                    ...((newTransaction.metadata as any) || {}),
                    kraCompliant: true,
                    etrGenerated: true,
                  },
                },
              });
            } catch (kraError: any) {
              console.error(
                `KRA Compliance failed for sale ${newTransaction.id}:`,
                kraError.message,
              );

              if (isBlocking && !forceOverride) {
                // If it's high value and Navari is down, block the sale unless forced
                if (kraError.isServiceDown) {
                  throw new Error(
                    `High-value sale blocked: KRA integration (Navari) is currently unavailable. Use override to proceed.`,
                  );
                }
                // If it's a bad request (e.g. invalid PIN), we still block high-value sales
                throw new Error(
                  `High-value sale blocked: KRA compliance error: ${kraError.message}`,
                );
              }

              // Non-blocking or Forced: Log error and continue
              await tx.transaction.update({
                where: { id: newTransaction.id },
                data: {
                  metadata: {
                    ...((newTransaction.metadata as any) || {}),
                    kraCompliant: false,
                    kraError: kraError.message,
                    kraOverride: forceOverride,
                  },
                },
              });

              // For non-high-value, we could still retry in background, but per requirements
              // we focus on the hybrid blocking logic.
            }
          };

          if (isHighValue) {
            // Blocking execution for high-value
            await executeKRACompliance(true);
          } else {
            // Non-blocking execution for regular value
            // We use a separate DB call outside the transaction to avoid closure issues
            // but for simplicity in this POS context, we can just run it after the transaction
            // by returning it as a post-process task.
            (newTransaction as any)._postProcessTax = true;
          }
        }

        // --- 9. Fulfillment ---
        const fulfillment = await tx.fulfillment.create({
          data: {
            transactionId: newTransaction.id,
            type: FulfillmentType.IMMEDIATE,
            status: FulfillmentStatus.COMPLETED,
            pickupLocationId: locationId,
            deliveredAt: transactionDate,
          },
        });

        await tx.fulfillmentItem.createMany({
          data: newTransaction.items.map((item) => ({
            fulfillmentId: fulfillment.id,
            transactionItemId: item.id,
            quantity: item.quantity,
          })),
        });

        // --- 9. Post-Sale Stock & Loyalty ---
        if (enableStockTracking) {
          await Promise.all(
            Array.from(variantStockUpdates.entries()).map(
              ([variantId, quantityChange]) =>
                tx.productVariantStock.updateMany({
                  where: { variantId, locationId, organizationId },
                  data: {
                    currentStock: { decrement: quantityChange },
                    availableStock: { decrement: quantityChange },
                  },
                }),
            ),
          );
        }

        return { ...newTransaction, subtotalBeforeTax, taxTotal };
      },
      { maxWait: 15000, timeout: 20000 },
    );

    // --- 10. Post-Transaction Background Tasks ---
    if ((result as any)._postProcessTax) {
      const capturedSubtotal = (result as any).subtotalBeforeTax;
      const capturedTaxTotal = (result as any).taxTotal;
      const postProcessTax = async () => {
        try {
          const customer = customerId
            ? await db.customer.findUnique({ where: { id: customerId } })
            : null;
          const kraPin = customer?.taxId || "A000000000X";

          await navariService.generateETRInvoice(organizationId, {
            invoiceId: result.id,
            kraPin,
            netTotal: capturedSubtotal.toNumber(),
            totalTaxes: capturedTaxTotal.toNumber(),
            items: result.items.map((item: any) => ({
              itemCode: item.sku,
              quantity: item.quantity,
              rate: item.unitPrice.toNumber(),
            })),
          });

          await db.transaction.update({
            where: { id: result.id },
            data: {
              metadata: {
                ...((result.metadata as any) || {}),
                kraCompliant: true,
                etrGenerated: true,
              },
            },
          });
        } catch (e: any) {
          console.error("Background KRA compliance failed:", e.message);
          await db.transaction
            .update({
              where: { id: result.id },
              data: {
                metadata: {
                  ...((result.metadata as any) || {}),
                  kraCompliant: false,
                  kraError: e.message,
                },
              },
            })
            .catch((err) => console.error("Failed to log KRA error:", err));
        }
      };
      postProcessTax().catch((e) =>
        console.error("Critical background task failure:", e),
      );
    }

    // Re-fetch for clean relations (fulfillments, etc.)
    const completeTransaction = await db.transaction.findUnique({
      where: { id: result.id },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: { select: { name: true } },
                  },
                },
              },
            },
            stockAllocations: {
              include: {
                stockBatch: { select: { id: true, batchNumber: true } },
              },
            },
          },
        },
        customer: true,
        businessAccount: true,
        member: { select: { id: true, user: { select: { name: true } } } },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            settings: { select: { defaultCurrency: true } },
          },
        },
        location: { select: { id: true, name: true } },
        taxes: {
          include: {
            taxRate: { select: { id: true, name: true, rate: true } },
          },
        },
        payments: true,
        fulfillments: { include: { items: true } },
      },
    });

    // --- 11. Document Generation ---
    const { documentService } = await import(
      "../../lib/services/document.service"
    );
    documentService
      .generateAndSaveInvoice(result.id, organizationId, memberId || null)
      .catch(err => console.error("Failed to auto-generate POS invoice:", err));
    documentService
      .generateAndSaveReceipt(result.id, organizationId, memberId || null)
      .catch(err => console.error("Failed to auto-generate POS receipt:", err));

    // --- 12. Real-time Notification ---
    realtimeService
      .publish(`org:${organizationId}:transactions`, "transaction:created", {
        id: result.id,
        number: result.number,
        type: result.type,
        status: result.status,
        finalTotal: result.finalTotal,
        customerName: completeTransaction?.customer?.name || "Walk-in Customer",
        locationName: completeTransaction?.location?.name,
        itemCount: completeTransaction?.items?.length || 0,
        createdAt: result.createdAt,
      })
      .catch((err) => console.error("Failed to publish real-time update:", err));

    return {
      success: true,
      message: `Sale ${result.number} processed successfully.`,
      transactionId: result.id,
      data: completeTransaction as TransactionWithDetails,
    };
  } catch (error: unknown) {
    console.error("--- POS Sale Processing CRITICAL ERROR ---");
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error("Error Details:", error);

    let errorMessage =
      "Failed to process sale due to an internal server error.";
    let errorDetails: string | object | undefined;

    if (error instanceof Error) {
      if (
        error.message.includes("Insufficient stock") ||
        error.message.includes("not found") ||
        error.message.includes("cannot exceed subtotal")
      ) {
        errorMessage = error.message;
      }
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = `A database error occurred. (Code: ${error.code})`;
      errorDetails = { code: error.code, meta: error.meta };
    }

    return {
      success: false,
      message: errorMessage,
      error:
        errorDetails ??
        (error instanceof Error ? error.message : "Unknown error."),
    };
  }
}
