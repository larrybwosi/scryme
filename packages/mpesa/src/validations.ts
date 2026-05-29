import { z } from 'zod';

export const MpesaEnvironmentEnum = z.enum(['SANDBOX', 'PRODUCTION']);
export const MpesaTypeEnum = z.enum(['PAYBILL', 'TILL']);
export const MpesaFlowTypeEnum = z.enum(['STK_PUSH', 'C2B']);

export const mpesaTriggerSchema = z.object({
  organizationId: z.string().cuid(),
  transactionId: z.string().cuid(),
  paymentId: z.string().cuid(),
  phoneNumber: z
    .string()
    .regex(/^(?:254|\+254|0)?(7(?:(?:[129][0-9])|(?:0[0-8])|(?:4[0-1]))[0-9]{6})$/, 'Invalid Kenyan phone number')
    .transform(val => {
      let cleaned = val.replace(/^\+/, '');
      if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1);
      } else if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned;
      }
      return cleaned;
    }),
  amount: z.number().positive().min(1),
});

export const mpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z
            .array(
              z.object({
                Name: z.string(),
                Value: z.union([z.string(), z.number()]).optional(),
              })
            )
            .optional(),
        })
        .optional(),
    }),
  }),
});

export const mpesaC2BValidationSchema = z.object({
  TransactionType: z.string(),
  TransID: z.string(),
  TransTime: z.string(),
  TransAmount: z.string(),
  BusinessShortCode: z.string(),
  BillRefNumber: z.string(),
  InvoiceNumber: z.string().optional(),
  OrgAccountBalance: z.string().optional(),
  ThirdPartyTransID: z.string().optional(),
  MSISDN: z.string(),
  FirstName: z.string().optional(),
  MiddleName: z.string().optional(),
  LastName: z.string().optional(),
});

export const mpesaC2BConfirmationSchema = mpesaC2BValidationSchema;

export const mpesaQuerySchema = z.object({
  organizationId: z.string().cuid(),
  checkoutRequestId: z.string(),
});

export const PaymentCredentialsSchema = z.object({
  mpesaShortCode: z.string().min(5, 'Shortcode must be at least 5 digits').max(7),
  mpesaType: MpesaTypeEnum.default('PAYBILL'),
  mpesaConsumerKey: z.string().min(10, 'Invalid Consumer Key'),
  mpesaConsumerSecret: z.string().min(10, 'Invalid Consumer Secret'),
  mpesaPassKey: z.string().optional().nullable(),
  mpesaInitiatorPass: z.string().optional().nullable(),
  environment: MpesaEnvironmentEnum.default('SANDBOX'),
});
