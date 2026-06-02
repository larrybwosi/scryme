import { db } from '@repo/db';
import { decrypt } from '../../api/v2/utils/encryption';
import { MpesaClient } from '../../../../mpesa/src/client';

export async function triggerStkPush(data: any): Promise<any> {
  const { organizationId, amount, phoneNumber, transactionId, paymentId, memberId } = data;

  const config = await db.paymentCredentials.findUnique({
    where: { organizationId },
  });

  if (!config) {
    throw new Error('M-Pesa is not configured for this organization');
  }

  const credentials = {
    mpesaConsumerKey: decrypt(config.mpesaConsumerKey),
    mpesaConsumerSecret: decrypt(config.mpesaConsumerSecret),
    mpesaShortCode: config.mpesaShortCode,
    mpesaPassKey: config.mpesaPassKey ? decrypt(config.mpesaPassKey) : '',
    mpesaType: config.mpesaType as any,
    environment: config.environment as any,
  };

  const client = new MpesaClient(credentials);
  const response = await client.initiateSTKPush({
    amount,
    phoneNumber,
    accountReference: transactionId,
    transactionDesc: `Payment for Transaction ${transactionId}`,
    callbackUrl: `${process.env.MPESA_CALLBACK_BASE_URL}/api/v2/payments/mpesa/webhooks/stkpush/${organizationId}/${paymentId}`,
  });

  // Record the request
  await db.mpesaPaymentRequest.create({
    data: {
      organizationId,
      memberId: memberId || 'system',
      paymentId,
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
      amount,
      phoneNumber,
      reference: transactionId,
      status: 'PENDING',
      saleNumber: transactionId,
    },
  });

  return response;
}
