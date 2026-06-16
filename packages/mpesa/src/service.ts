import { db, Payment, UnclaimedPayment } from '@repo/db';
import { realtimeService } from '@repo/shared/realtime';
import { decrypt } from '@repo/shared/api/v2/utils/encryption';
import { MpesaClient } from './client';
import { MpesaTriggerInput, MpesaCallbackPayload, MpesaC2BPayload, MpesaCredentials } from './types';
import {
  mpesaTriggerSchema,
  mpesaCallbackSchema,
  mpesaC2BConfirmationSchema,
  mpesaC2BValidationSchema,
} from './validations';

import { Injectable, ForbiddenException } from '@nestjs/common';

// Safaricom M-Pesa IP Ranges (Source: Safaricom Developer Portal)
const SAFARICOM_IPS = [
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74',
  '196.201.212.69',
  '196.201.214.0/24',
  '196.201.213.0/24',
  '196.201.212.0/24',
];

@Injectable()
export class MpesaService {
  /**
   * Validates if the request is coming from Safaricom.
   */
  validateWebhookIp(ip: string) {
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_IP_VALIDATION === 'true') {
      return true;
    }

    const cleanIp = ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;

    const isWhitelisted = SAFARICOM_IPS.some((range) => {
      if (range.includes('/')) {
        const [subnet, mask] = range.split('/');
        const ipNum = this.ipToLong(cleanIp);
        const subnetNum = this.ipToLong(subnet);
        const maskNum = -1 << (32 - parseInt(mask, 10));
        return (ipNum & maskNum) === (subnetNum & maskNum);
      }
      return range === cleanIp;
    });

    if (!isWhitelisted) {
      console.warn(`Unauthorized M-Pesa Callback from IP: ${ip}`);
      throw new ForbiddenException('Invalid Callback Source');
    }
  }

  private ipToLong(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  /**
   * Initiates an STK Push (Lipa Na M-Pesa Online).
   */
  async initiateStkPush(input: MpesaTriggerInput & { userId?: string }) {
    const parsed = mpesaTriggerSchema.safeParse(input);
    if (!parsed.success) {
      console.error('Invalid M-Pesa Trigger Input:', parsed.error);
      throw new Error('Invalid input');
    }

    const { organizationId, amount, phoneNumber, transactionId, paymentId } = parsed.data;

    const config = await db.paymentCredentials.findUnique({
      where: { organizationId },
    });

    if (!config) {
      throw new Error('M-Pesa is not configured for this organization');
    }

    const credentials: MpesaCredentials = {
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
        memberId: input.userId || 'system',
        paymentId,
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        amount,
        phoneNumber,
        reference: transactionId,
        status: 'PENDING',
        saleNumber: transactionId, // Using transactionId as reference
      },
    });

    return response;
  }

  /**
   * Handles STK Push Callback from Safaricom.
   */
  async handleStkCallback(organizationId: string, paymentId: string, payload: MpesaCallbackPayload) {
    try {
      const { Body } = payload;
      const { stkCallback } = Body;
      const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = stkCallback;

      const mpesaReceipt = CallbackMetadata?.Item?.find((item) => item.Name === 'MpesaReceiptNumber')?.Value as string;
      const amountPaid = Number(CallbackMetadata?.Item?.find((item) => item.Name === 'Amount')?.Value || 0);

      const paymentStatus = ResultCode === 0 ? 'PAID' : 'FAILED';

      await db.$transaction(async (tx: any) => {
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: paymentStatus,
            gatewayTxnId: mpesaReceipt,
            amountReceived: ResultCode === 0 ? amountPaid : 0,
            gatewayResponse: payload as any,
            notes: ResultDesc,
            processedAt: new Date(),
          },
        });

        // Update the MpesaPaymentRequest
        await tx.mpesaPaymentRequest.updateMany({
          where: { checkoutRequestId: CheckoutRequestID },
          data: {
            status: ResultCode === 0 ? 'SUCCESS' : 'FAILED',
            resultCode: ResultCode,
            resultDescription: ResultDesc,
            mpesaReceiptNumber: mpesaReceipt,
            transactionDate: new Date(),
          },
        });

        // Audit Logging
        await tx.auditLog.create({
          data: {
            organizationId,
            action: 'UPDATE',
            entityType: 'PAYMENT_GATEWAY',
            entityId: paymentId,
            description: `M-Pesa STK Callback: ${ResultDesc} (${ResultCode})`,
            status: ResultCode === 0 ? 'SUCCESS' : 'FAILURE',
            details: payload as any,
          },
        });

        if (paymentStatus === 'PAID') {
          await this.updateTransactionOnPayment(tx, updatedPayment.transactionId, amountPaid);
        }
      });

      const status = ResultCode === 0 ? 'COMPLETED' : 'FAILED';
      await realtimeService.publish(`organization:${organizationId}:payments`, 'payment-update', {
        paymentId,
        status,
        data: {
          receipt: mpesaReceipt,
          description: ResultDesc,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      throw error;
    }
  }

  private async updateTransactionOnPayment(tx: any, transactionId: string, amount: number) {
    const updatedTransaction = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        totalPaid: { increment: amount },
      },
    });

    // Check if transaction is now fully paid
    let newPaymentStatus = 'PARTIALLY_PAID';
    if (Number(updatedTransaction.totalPaid) >= Number(updatedTransaction.finalTotal)) {
      newPaymentStatus = 'PAID';
    }

    await tx.transaction.update({
      where: { id: updatedTransaction.id },
      data: {
        paymentStatus: newPaymentStatus as any,
        status: newPaymentStatus === 'PAID' ? 'CONFIRMED' : updatedTransaction.status,
      },
    });

    // Also update any linked invoices
    const grandTotal = Number(updatedTransaction.finalTotal);
    const balanceDue = grandTotal - Number(updatedTransaction.totalPaid);

    await tx.invoice.updateMany({
      where: { transactionId: transactionId },
      data: {
        amountPaid: Number(updatedTransaction.totalPaid),
        balanceDue: balanceDue,
        status: newPaymentStatus === 'PAID' ? 'PAID' : 'PARTIALLY_PAID',
      },
    });
  }

  /**
   * Processes C2B Validation.
   */
  async handleC2BValidation(payload: any) {
    const parsed = mpesaC2BValidationSchema.safeParse(payload);
    if (!parsed.success) {
      console.error('Invalid M-Pesa C2B Validation Payload:', parsed.error);
      return { ResultCode: 1, ResultDesc: 'Invalid payload' };
    }

    const { BillRefNumber } = parsed.data;

    // Check if a transaction exists with this order number
    const transaction = await db.transaction.findFirst({
      where: { number: BillRefNumber },
    });

    if (!transaction) {
      // We can still accept the payment and mark it as unclaimed
      return { ResultCode: 0, ResultDesc: 'Accepted - Unclaimed' };
    }

    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  /**
   * Processes C2B Confirmation.
   */
  async handleC2BConfirmation(payload: any) {
    const parsed = mpesaC2BConfirmationSchema.safeParse(payload);
    if (!parsed.success) {
      console.error('Invalid M-Pesa C2B Confirmation Payload:', parsed.error);
      return { success: false, error: 'Invalid payload' };
    }

    const { TransID, TransAmount, BillRefNumber, MSISDN, FirstName, MiddleName, LastName, BusinessShortCode } =
      parsed.data;

    const amount = Number(TransAmount);

    // Attempt to find the transaction by order number
    const transaction = await db.transaction.findFirst({
      where: { number: BillRefNumber },
      include: { organization: true },
    });

    try {
      if (transaction) {
        await db.$transaction(async (tx: any) => {
          // Idempotency check: check if payment already recorded
          const existingPayment = await tx.payment.findFirst({
            where: { gatewayTxnId: TransID },
          });

          if (existingPayment) return;

          const payment = await tx.payment.create({
            data: {
              transactionId: transaction.id,
              organizationId: transaction.organizationId,
              method: 'MPESA',
              status: 'PAID',
              amount: amount,
              amountReceived: amount,
              gatewayTxnId: TransID,
              gatewayResponse: payload as any,
              payerPhone: MSISDN,
              payerName: [FirstName, MiddleName, LastName].filter(Boolean).join(' '),
              processedAt: new Date(),
              referenceNumber: BillRefNumber,
            },
          });

          await this.updateTransactionOnPayment(tx, transaction.id, amount);

          await realtimeService.publish(`organization:${transaction.organizationId}:payments`, 'payment-update', {
            transactionId: transaction.id,
            status: 'COMPLETED',
            data: {
              receipt: TransID,
              amount,
            },
          });

          // Audit Logging
          await tx.auditLog.create({
            data: {
              organizationId: transaction.organizationId,
              action: 'CREATE',
              entityType: 'PAYMENT_GATEWAY',
              entityId: payment.id,
              description: `M-Pesa C2B Confirmation: Received ${amount} for order ${BillRefNumber}`,
              status: 'SUCCESS',
              details: payload as any,
            },
          });
        });
      } else {
        // Unclaimed payment
        await db.$transaction(async (tx: any) => {
          const unclaimed = await tx.unclaimedPayment.upsert({
            where: { transId: TransID },
            update: {},
            create: {
              transId: TransID,
              transTime: new Date(), // Should ideally parse TransTime from Safaricom format
              amount: amount,
              msisdn: MSISDN,
              firstName: FirstName,
              middleName: MiddleName,
              lastName: LastName,
              billRefNumber: BillRefNumber,
              shortCode: BusinessShortCode,
              rawResponse: payload as any,
            },
          });

          // Audit Logging for unclaimed
          await tx.auditLog.create({
            data: {
              action: 'CREATE',
              entityType: 'PAYMENT_GATEWAY',
              entityId: unclaimed.id,
              description: `M-Pesa C2B Confirmation (Unclaimed): Received ${amount} for unknown order ${BillRefNumber}`,
              status: 'WARNING',
              details: payload as any,
            },
          });
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Error in handleC2BConfirmation:', error);
      throw error;
    }
  }

  /**
   * Reliable payment verification for POS clients.
   */
  async verifyPayment(transactionId: string) {
    // 1. Check if there is already a PAID payment for this transaction
    const successfulPayment = await db.payment.findFirst({
      where: {
        transactionId,
        status: 'PAID',
      },
    });

    if (successfulPayment) {
      return {
        status: 'PAID',
        amount: successfulPayment.amount,
        receipt: successfulPayment.gatewayTxnId,
        paidAt: successfulPayment.processedAt,
      };
    }

    // 2. Check the transaction status
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new Error('Transaction not found');

    if (transaction.paymentStatus === 'PAID') {
      return { status: 'PAID', amount: transaction.totalPaid };
    }

    // 3. Check for pending STK Push requests
    const pendingRequest = await db.mpesaPaymentRequest.findFirst({
      where: {
        saleNumber: transaction.number,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingRequest) {
      // Optional: We could query Safaricom here to be absolutely sure
      // For now, return processing
      return {
        status: 'PROCESSING',
        checkoutRequestId: pendingRequest.checkoutRequestId,
        message: 'STK Push is still pending',
      };
    }

    // 4. Check Unclaimed Payments (C2B)
    const unclaimed = await db.unclaimedPayment.findFirst({
      where: {
        billRefNumber: transaction.number,
        claimed: false,
      },
    });

    if (unclaimed) {
      return {
        status: 'UNCLAIMED_FOUND',
        amount: unclaimed.amount,
        receipt: unclaimed.transId,
        message: 'A matching unclaimed payment was found. Please claim it.',
      };
    }

    return { status: 'UNPAID' };
  }

  /**
   * Legacy validate method - redirects to verifyPayment
   */
  async validate(input: {
    transactionCode: string;
    organizationId: string;
    saleId?: string;
    userId?: string;
  }): Promise<any> {
    if (input.saleId) {
      return this.verifyPayment(input.saleId);
    }
    // Search by transaction code (receipt)
    const payment = await db.payment.findFirst({
      where: { gatewayTxnId: input.transactionCode, organizationId: input.organizationId },
    });

    if (payment) {
      return { success: true, verified: true, payment };
    }

    const unclaimed = await db.unclaimedPayment.findFirst({
      where: { transId: input.transactionCode },
    });

    return { success: !!unclaimed, verified: !!unclaimed, unclaimed };
  }

  /**
   * Search for unclaimed payments by receipt code, phone, or name.
   */
  async searchUnclaimedPayments(organizationId: string, query: string) {
    const isPhone = /^[0-9+]+$/.test(query);

    return db.unclaimedPayment.findMany({
      where: {
        organizationId,
        claimed: false,
        OR: [
          { transId: { contains: query, mode: 'insensitive' } },
          { msisdn: { contains: query } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { middleName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { billRefNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { transTime: 'desc' },
      take: 20,
    });
  }

  /**
   * Claims an unclaimed payment and links it to a transaction.
   */
  async claimPayment(organizationId: string, unclaimedPaymentId: string, transactionId: string, memberId: string) {
    const unclaimed = await db.unclaimedPayment.findUnique({
      where: { id: unclaimedPaymentId },
    });

    if (!unclaimed) throw new Error('Unclaimed payment not found');
    if (unclaimed.claimed) throw new Error('Payment already claimed');

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new Error('Transaction not found');

    return db.$transaction(async (tx: any) => {
      // Create a payment record
      const payment = await tx.payment.create({
        data: {
          transactionId: transaction.id,
          organizationId,
          method: 'MPESA',
          status: 'PAID',
          amount: unclaimed.amount,
          amountReceived: unclaimed.amount,
          gatewayTxnId: unclaimed.transId,
          gatewayResponse: unclaimed.rawResponse as any,
          payerPhone: unclaimed.msisdn,
          payerName: [unclaimed.firstName, unclaimed.middleName, unclaimed.lastName].filter(Boolean).join(' '),
          processedAt: new Date(),
          referenceNumber: unclaimed.billRefNumber,
          notes: `Manually claimed by member ${memberId}`,
        },
      });

      // Update unclaimed payment
      await tx.unclaimedPayment.update({
        where: { id: unclaimedPaymentId },
        data: {
          claimed: true,
          claimedAt: new Date(),
          claimedByUserId: memberId,
          paymentId: payment.id,
        },
      });

      // Update transaction status
      await this.updateTransactionOnPayment(tx, transaction.id, Number(unclaimed.amount));

      // Realtime notification
      await realtimeService.publish(`organization:${organizationId}:payments`, 'payment-update', {
        transactionId: transaction.id,
        status: 'COMPLETED',
        data: {
          receipt: unclaimed.transId,
          amount: unclaimed.amount,
        },
      });

      return payment;
    });
  }

  /**
   * Manually verify a transaction code against Safaricom's API.
   */
  async verifyWithSafaricom(organizationId: string, transactionCode: string) {
    // 1. Check DB first (standard verifyPayment does this, but let's be explicit)
    const existingPayment = await db.payment.findFirst({
      where: { gatewayTxnId: transactionCode, organizationId },
    });

    if (existingPayment) {
      return { verified: true, source: 'DB', payment: existingPayment };
    }

    const unclaimed = await db.unclaimedPayment.findFirst({
      where: { transId: transactionCode, organizationId },
    });

    if (unclaimed) {
      return { verified: true, source: 'UNCLAIMED', unclaimed };
    }

    // 2. Query Safaricom if not found locally
    const config = await db.paymentCredentials.findUnique({
      where: { organizationId },
    });

    if (!config) throw new Error('M-Pesa not configured');

    const credentials: MpesaCredentials = {
      mpesaConsumerKey: decrypt(config.mpesaConsumerKey),
      mpesaConsumerSecret: decrypt(config.mpesaConsumerSecret),
      mpesaShortCode: config.mpesaShortCode,
      mpesaPassKey: config.mpesaPassKey ? decrypt(config.mpesaPassKey) : '',
      mpesaType: config.mpesaType as any,
      environment: config.environment as any,
      mpesaInitiatorPass: config.mpesaInitiatorPass ? decrypt(config.mpesaInitiatorPass) : undefined,
    };

    const client = new MpesaClient(credentials);
    try {
      const response = await client.getTransactionStatus({
        transactionCode,
        callbackUrl: `${process.env.MPESA_CALLBACK_BASE_URL}/api/v2/payments/mpesa/webhooks/transaction-status/${organizationId}`,
      });

      return {
        verified: false,
        source: 'SAFARICOM',
        message: 'Request sent to Safaricom. Please wait for callback or check again in a moment.',
        response,
      };
    } catch (error: any) {
      console.error('Safaricom verification error:', error);
      throw new Error(`Failed to verify with Safaricom: ${error.message}`);
    }
  }
}
