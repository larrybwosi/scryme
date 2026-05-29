import { z } from 'zod';
import {
  mpesaTriggerSchema,
  mpesaCallbackSchema,
  mpesaC2BValidationSchema,
  mpesaC2BConfirmationSchema,
  mpesaQuerySchema,
  PaymentCredentialsSchema,
  MpesaEnvironmentEnum,
  MpesaTypeEnum,
} from './validations';

export type MpesaTriggerInput = z.infer<typeof mpesaTriggerSchema>;
export type MpesaCallbackPayload = z.infer<typeof mpesaCallbackSchema>;
export type MpesaC2BPayload = z.infer<typeof mpesaC2BValidationSchema>;
export type MpesaQueryInput = z.infer<typeof mpesaQuerySchema>;
export type MpesaCredentials = z.infer<typeof PaymentCredentialsSchema>;
export type MpesaEnvironment = z.infer<typeof MpesaEnvironmentEnum>;
export type MpesaType = z.infer<typeof MpesaTypeEnum>;

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface STKQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export interface C2BRegistrationResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseDescription: string;
}
