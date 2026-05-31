import {
  FulfillmentType,
  PaymentStatus,
  TransactionType,
  TransactionStatus,
  FulfillmentStatus,
  AllocationStatus,
  PaymentMethod,
  prisma as db,
  Prisma
} from '@repo/db';
import { ProcessSaleInput, ProcessSaleResult, TransactionWithDetails } from '../../lib/validations/sale';
import { Decimal } from 'decimal.js';

export async function processSale(organizationId: string, memberId: string, data: ProcessSaleInput): Promise<ProcessSaleResult> {
    try {
        const result = await db.$transaction(async (tx) => {
            // 0. Fetch organization settings for tax and currency
            const organization = await tx.organization.findUnique({
                where: { id: organizationId },
                include: { settings: true }
            });

            const taxRate = organization?.settings?.defaultTaxRate ? new Decimal(organization.settings.defaultTaxRate as any).div(100) : new Decimal(0.16);
            const currencyCode = organization?.settings?.defaultCurrency as string || 'KES';

            // 1. Calculate totals
            let subtotal = new Decimal(0);
            const itemsToCreate = [];

            for (const item of data.cartItems) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { product: true }
                });

                if (!variant) throw new Error(`Variant ${item.variantId} not found`);

                const unitPrice = new Decimal((item as any).unitPrice || variant.retailPrice || 0);
                const lineSubtotal = unitPrice.times(item.quantity);
                subtotal = subtotal.plus(lineSubtotal);

                itemsToCreate.push({
                    variantId: item.variantId,
                    productName: variant.product.name,
                    variantName: variant.name,
                    sku: variant.sku,
                    quantity: item.quantity,
                    listPrice: variant.retailPrice || 0,
                    unitPrice: unitPrice,
                    unitCost: variant.buyingPrice || 0,
                    subtotal: lineSubtotal,
                    lineTotal: lineSubtotal,
                    sellingUnitId: item.sellingUnitId,
                });
            }

            const taxTotal = subtotal.mul(taxRate);
            const finalTotal = subtotal.plus(taxTotal).minus(data.discountAmount || 0);

            // 2. Create Transaction
            const transaction = await tx.transaction.create({
                data: {
                    number: data.saleNumber || `SALE-${Date.now()}`,
                    type: TransactionType.POS_SALE,
                    status: TransactionStatus.COMPLETED,
                    paymentStatus: PaymentStatus.PAID,
                    organizationId,
                    memberId,
                    locationId: data.locationId,
                    customerId: data.customerId,
                    subtotal,
                    taxTotal,
                    discountTotal: data.discountAmount || 0,
                    finalTotal,
                    baseCurrencyTotal: finalTotal,
                    currencyCode,
                    items: {
                        create: itemsToCreate
                    },
                    payments: {
                        create: data.payments.map(p => ({
                            organizationId,
                            method: p.method,
                            status: PaymentStatus.COMPLETED,
                            amount: p.amount,
                            amountReceived: p.amountReceived,
                            change: p.change,
                            referenceNumber: p.reference,
                            payerPhone: p.mpesaPhoneNumber,
                        }))
                    }
                },
                include: {
                    items: true,
                    payments: true,
                    customer: true
                }
            });

            return transaction;
        });

        return {
            success: true,
            message: 'Sale processed successfully',
            transactionId: result.id,
            data: result
        };
    } catch (error: any) {
        console.error('ProcessSale Error:', error);
        return {
            success: false,
            message: error.message || 'Failed to process sale',
            transactionId: '',
            data: null
        };
    }
}
