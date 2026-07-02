import { z } from 'zod';
export declare enum MpesaFlowType {
    STK_PUSH = "STK_PUSH",
    PAYBILL_MANUAL = "PAYBILL_MANUAL",
    TILL_MANUAL = "TILL_MANUAL"
}
export declare const ProcessSaleInputSchema: z.ZodObject<{
    cartItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        variantId: z.ZodString;
        quantity: z.ZodNumber;
        sellingUnitId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    locationId: z.ZodString;
    saleNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isWholesale: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    businessAccountId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    payments: z.ZodArray<z.ZodObject<{
        method: z.ZodEnum<{
            readonly CASH: "CASH";
            readonly CREDIT: "CREDIT";
            readonly CARD: "CARD";
            readonly MOBILE_PAYMENT: "MOBILE_PAYMENT";
            readonly MPESA_C2B: "MPESA_C2B";
            readonly BANK_TRANSFER: "BANK_TRANSFER";
            readonly CHEQUE: "CHEQUE";
            readonly STORE_CREDIT: "STORE_CREDIT";
            readonly GIFT_CARD: "GIFT_CARD";
            readonly LOYALTY_POINTS: "LOYALTY_POINTS";
            readonly ON_ACCOUNT: "ON_ACCOUNT";
            readonly MPESA: "MPESA";
            readonly OTHER: "OTHER";
        }>;
        amount: z.ZodNumber;
        mpesaPhoneNumber: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
        mpesaFlowType: z.ZodDefault<z.ZodOptional<z.ZodEnum<typeof MpesaFlowType>>>;
        amountReceived: z.ZodOptional<z.ZodNumber>;
        change: z.ZodOptional<z.ZodNumber>;
        reference: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    mpesaPhoneNumber: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
    amountReceived: z.ZodOptional<z.ZodNumber>;
    change: z.ZodOptional<z.ZodNumber>;
    discountAmount: z.ZodNullable<z.ZodDefault<z.ZodNumber>>;
    cashDrawerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mpesaType: z.ZodNullable<z.ZodOptional<z.ZodEnum<typeof MpesaFlowType>>>;
    enableStockTracking: z.ZodBoolean;
    taxIntegrationEnabled: z.ZodOptional<z.ZodBoolean>;
    forceTaxOverride: z.ZodOptional<z.ZodBoolean>;
    country: z.ZodOptional<z.ZodString>;
    taxIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    voucherCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pointsToRedeem: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    saleDate: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export type ProcessSaleInput = z.infer<typeof ProcessSaleInputSchema>;
export type TransactionWithDetails = any;
export type ProcessSaleResult = {
    success: boolean;
    message: string;
    transactionId?: string;
    data?: any;
    error?: any;
};
