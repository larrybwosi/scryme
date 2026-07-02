import { z } from "zod";
export declare enum OrderTransactionStatus {
    PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
    CONFIRMED = "CONFIRMED",
    DRAFT = "DRAFT"
}
export declare const OrderItemInputSchema: z.ZodObject<{
    variantId: z.ZodString;
    sellingUnitId: z.ZodOptional<z.ZodString>;
    quantity: z.ZodNumber;
    unitPrice: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const OrderPaymentInputSchema: z.ZodObject<{
    method: z.ZodUnion<[z.ZodEnum<{
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
    }>, z.ZodAny]>;
    amount: z.ZodNumber;
}, z.core.$strip>;
export declare const OrderFulfillmentInputSchema: z.ZodObject<{
    type: z.ZodUnion<[z.ZodEnum<{
        readonly IMMEDIATE: "IMMEDIATE";
        readonly PICKUP: "PICKUP";
        readonly DELIVERY: "DELIVERY";
        readonly SHIPPING: "SHIPPING";
        readonly DIGITAL: "DIGITAL";
        readonly DINE_IN: "DINE_IN";
        readonly SERVICE: "SERVICE";
    }>, z.ZodAny]>;
    shippingAddressId: z.ZodOptional<z.ZodString>;
    pickupLocationId: z.ZodOptional<z.ZodString>;
    tableNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateOrderInputSchema: z.ZodObject<{
    customerId: z.ZodString;
    businessAccountId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodString;
    type: z.ZodEnum<{
        readonly POS_SALE: "POS_SALE";
        readonly ONLINE_ORDER: "ONLINE_ORDER";
        readonly SALES_ORDER: "SALES_ORDER";
        readonly SERVICE_BOOKING: "SERVICE_BOOKING";
        readonly SUBSCRIPTION: "SUBSCRIPTION";
        readonly QUOTE: "QUOTE";
    }> & z.ZodType<"ONLINE_ORDER" | "SALES_ORDER" | "SERVICE_BOOKING" | "SUBSCRIPTION" | "QUOTE", "POS_SALE" | "ONLINE_ORDER" | "SALES_ORDER" | "SERVICE_BOOKING" | "SUBSCRIPTION" | "QUOTE", z.core.$ZodTypeInternals<"ONLINE_ORDER" | "SALES_ORDER" | "SERVICE_BOOKING" | "SUBSCRIPTION" | "QUOTE", "POS_SALE" | "ONLINE_ORDER" | "SALES_ORDER" | "SERVICE_BOOKING" | "SUBSCRIPTION" | "QUOTE">>;
    items: z.ZodArray<z.ZodObject<{
        variantId: z.ZodString;
        sellingUnitId: z.ZodOptional<z.ZodString>;
        quantity: z.ZodNumber;
        unitPrice: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    payments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        method: z.ZodUnion<[z.ZodEnum<{
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
        }>, z.ZodAny]>;
        amount: z.ZodNumber;
    }, z.core.$strip>>>;
    fulfillment: z.ZodOptional<z.ZodObject<{
        type: z.ZodUnion<[z.ZodEnum<{
            readonly IMMEDIATE: "IMMEDIATE";
            readonly PICKUP: "PICKUP";
            readonly DELIVERY: "DELIVERY";
            readonly SHIPPING: "SHIPPING";
            readonly DIGITAL: "DIGITAL";
            readonly DINE_IN: "DINE_IN";
            readonly SERVICE: "SERVICE";
        }>, z.ZodAny]>;
        shippingAddressId: z.ZodOptional<z.ZodString>;
        pickupLocationId: z.ZodOptional<z.ZodString>;
        tableNumber: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    status: z.ZodDefault<z.ZodEnum<typeof OrderTransactionStatus>>;
    notes: z.ZodOptional<z.ZodString>;
    termsAndConditions: z.ZodOptional<z.ZodString>;
    shippingFee: z.ZodDefault<z.ZodNumber>;
    discountAmount: z.ZodDefault<z.ZodNumber>;
    deliveryPartnerId: z.ZodOptional<z.ZodString>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        fileName: z.ZodString;
        fileUrl: z.ZodString;
        mimeType: z.ZodString;
        sizeBytes: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    taxIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    enableStockTracking: z.ZodOptional<z.ZodBoolean>;
    isWholesale: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export declare const OrderFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    searchTerm: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodDate>;
    dateTo: z.ZodOptional<z.ZodDate>;
    sortBy: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
