import {
  FulfillmentStatus,
  FulfillmentType,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  Decimal,
  db
} from '@repo/db';
import { CreateOrderInput, CreateOrderInputSchema } from '../../lib/validations/order';

export type CreateOrderResult = {
  success: boolean;
  message: string;
  data?: any;
};

export async function createOrder(
  organizationId: string,
  memberId: string,
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    // 1. Validate Input
    const validated = CreateOrderInputSchema.parse(input);

    const result = await db.$transaction(async (tx) => {
      // 2. Fetch Variant Details for snapshots
      const variantIds = validated.items.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: {
          id: { in: variantIds },
          product: { organizationId },
        },
        include: {
          product: true,
        },
      });

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // 3. Generate Order Number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 4. Calculate Item Totals
      let subtotal = new Decimal(0);
      const transactionItemsData = validated.items.map((item) => {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found`);
        }

        const unitPrice = new Decimal(item.unitPrice ?? variant.retailPrice ?? 0);
        const quantity = new Decimal(item.quantity);
        const lineSubtotal = unitPrice.mul(quantity);
        subtotal = subtotal.add(lineSubtotal);

        return {
          variantId: item.variantId,
          productId: variant.productId, productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          quantity: item.quantity,
          listPrice: variant.retailPrice ?? 0,
          unitPrice,
          unitCost: variant.buyingPrice ?? 0,
          subtotal: lineSubtotal,
          lineTotal: lineSubtotal, // Simplified: no line-level tax/discount for now
          sellingUnitId: item.sellingUnitId,
        };
      });

      const discountTotal = new Decimal(validated.discountAmount);
      const shippingTotal = new Decimal(validated.shippingFee);
      // Simplified tax calculation: assume tax is 0 or handled at the end
      const taxTotal = new Decimal(0);
      const finalTotal = subtotal.sub(discountTotal).add(shippingTotal).add(taxTotal);

      // 5. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          number: orderNumber,
          type: validated.type,
          status: validated.status as any, // Map to DB enum
          organizationId,
          customerId: validated.customerId,
          memberId,
          locationId: validated.locationId,
          subtotal,
          discountTotal,
          taxTotal,
          shippingTotal,
          finalTotal,
          baseCurrencyTotal: finalTotal,
          notes: validated.notes,
          lpoNumber: validated.lpoNumber,
          lpoDate: validated.lpoDate,
          lpoExpiryDate: validated.lpoExpiryDate,
          lpoUrl: validated.lpoUrl,
          items: {
            create: transactionItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 6. Create Payments (if any)
      const totalPaid = validated.payments.reduce((acc, p) => acc.add(new Decimal(p.amount)), new Decimal(0));
      if (validated.payments.length > 0) {
        await tx.payment.createMany({
          data: validated.payments.map((p) => ({
            transactionId: transaction.id,
            method: p.method,
            amount: p.amount,
            status: PaymentStatus.COMPLETED, // Assume POS-entered payments are completed
            product: { organizationId },
          })),
        });

        // Update transaction totalPaid and paymentStatus
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            totalPaid,
            paymentStatus: totalPaid.gte(finalTotal) ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID,
          },
        });
      }

      // 7. Create Fulfillment record
      await tx.fulfillment.create({
        data: {
          transactionId: transaction.id,
          type: validated.fulfillment.type,
          status: FulfillmentStatus.PENDING,
          shippingAddressId: validated.fulfillment.shippingAddressId,
          pickupLocationId: validated.fulfillment.pickupLocationId,
        },
      });

      return transaction;
    });

    return {
      success: true,
      message: 'Order created successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('Error in createOrder shared action:', error);
    return {
      success: false,
      message: error.message || 'Failed to create order',
    };
  }
}
