import { MpesaService } from '../service';
import { db } from '@repo/db';
import { realtimeService } from '@repo/shared/realtime';
import { MpesaClient } from '../client';

jest.mock('@repo/db', () => ({
  db: {
    paymentCredentials: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    transaction: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    mpesaPaymentRequest: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    unclaimedPayment: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
    },
    invoice: {
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(db)),
  },
}));

jest.mock('@repo/shared/api/v2', () => ({
  decrypt: jest.fn((val) => Promise.resolve(val)),
}));

jest.mock('@repo/shared/realtime', () => ({
  realtimeService: {
    publish: jest.fn(),
  },
}));

jest.mock('../client');

describe('MpesaService', () => {
  let service: MpesaService;

  beforeEach(() => {
    service = new MpesaService();
    jest.clearAllMocks();
  });

  describe('handleC2BConfirmation', () => {
    const payload = {
      TransactionType: 'Pay Bill',
      TransID: 'RKT88MN6W3',
      TransTime: '20230525141521',
      TransAmount: '100.00',
      BusinessShortCode: '174379',
      BillRefNumber: 'ORD-123',
      MSISDN: '254712345678',
      FirstName: 'John',
    };

    it('should match payment to transaction if BillRefNumber exists and scope by organizationId', async () => {
      const mockTransaction = {
        id: 'tx_123',
        number: 'ORD-123',
        organizationId: 'org_123',
        totalPaid: 0,
        finalTotal: 1000,
        status: 'DRAFT',
      };

      (db.paymentCredentials.findFirst as jest.Mock).mockResolvedValue({ organizationId: 'org_123' });
      (db.transaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);
      (db.payment.findFirst as jest.Mock).mockResolvedValue(null);
      (db.payment.create as jest.Mock).mockResolvedValue({ id: 'pay_123' });
      (db.transaction.update as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        totalPaid: 100,
      });

      await service.handleC2BConfirmation(payload);

      expect(db.paymentCredentials.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { mpesaShortCode: '174379' }
      }));
      expect(db.transaction.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { number: 'ORD-123', organizationId: 'org_123' }
      }));
      expect(db.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionId: 'tx_123',
            amount: 100,
            gatewayTxnId: 'RKT88MN6W3',
          }),
        })
      );
      expect(db.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tx_123' },
          data: expect.objectContaining({ totalPaid: { increment: 100 } }),
        })
      );
      expect(realtimeService.publish).toHaveBeenCalled();
      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it('should mark as unclaimed if transaction not found and include organizationId', async () => {
      (db.paymentCredentials.findFirst as jest.Mock).mockResolvedValue({ organizationId: 'org_123' });
      (db.transaction.findFirst as jest.Mock).mockResolvedValue(null);
      (db.unclaimedPayment.upsert as jest.Mock).mockResolvedValue({ id: 'unclaimed_123' });

      await service.handleC2BConfirmation(payload);

      expect(db.unclaimedPayment.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { transId: 'RKT88MN6W3' },
        create: expect.objectContaining({
          organizationId: 'org_123'
        })
      }));
      expect(db.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'WARNING' }),
      }));
    });
  });

  describe('verifyPayment', () => {
    it('should return PAID if a successful payment exists', async () => {
      (db.payment.findFirst as jest.Mock).mockResolvedValue({
        status: 'PAID',
        amount: 100,
        gatewayTxnId: 'REC123',
        processedAt: new Date(),
      });

      const result = await service.verifyPayment('tx_123');

      expect(result.status).toBe('PAID');
      expect(result.receipt).toBe('REC123');
    });

    it('should return PROCESSING if an STK push is pending', async () => {
      (db.payment.findFirst as jest.Mock).mockResolvedValue(null);
      (db.transaction.findFirst as jest.Mock).mockResolvedValue({ id: 'tx_123', number: 'ORD-123', paymentStatus: 'UNPAID' });
      (db.mpesaPaymentRequest.findFirst as jest.Mock).mockResolvedValue({
        status: 'PENDING',
        checkoutRequestId: 'ws_123',
      });

      const result = await service.verifyPayment('tx_123');

      expect(result.status).toBe('PROCESSING');
      expect(result.checkoutRequestId).toBe('ws_123');
    });

    it('should return UNCLAIMED_FOUND if a matching unclaimed payment exists', async () => {
        (db.payment.findFirst as jest.Mock).mockResolvedValue(null);
        (db.transaction.findFirst as jest.Mock).mockResolvedValue({ id: 'tx_123', number: 'ORD-123', paymentStatus: 'UNPAID' });
        (db.mpesaPaymentRequest.findFirst as jest.Mock).mockResolvedValue(null);
        (db.unclaimedPayment.findFirst as jest.Mock).mockResolvedValue({
            transId: 'REC456',
            amount: 500,
            billRefNumber: 'ORD-123'
        });

        const result = await service.verifyPayment('tx_123');

        expect(result.status).toBe('UNCLAIMED_FOUND');
        expect(result.receipt).toBe('REC456');
    });
  });

  describe('handleStkCallback', () => {
    it('should scope payment update by organizationId', async () => {
      const payload = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'mr_123',
            CheckoutRequestID: 'ws_123',
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'REC123' },
                { Name: 'Amount', Value: 100 }
              ]
            }
          }
        }
      };

      (db.payment.update as jest.Mock).mockResolvedValue({ id: 'pay_123', transactionId: 'tx_123' });

      await service.handleStkCallback('org_123', 'pay_123', payload as any);

      expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'pay_123', organizationId: 'org_123' }
      }));
    });
  });

  describe('validateWebhookIp', () => {
    it('should allow whitelisted IPs and handle IPv4-mapped IPv6', () => {
      process.env.NODE_ENV = 'production';
      expect(service.validateWebhookIp('196.201.214.200')).toBe(true);
      expect(service.validateWebhookIp('196.201.214.50')).toBe(true); // in range 196.201.214.0/24
      expect(service.validateWebhookIp('::ffff:196.201.214.200')).toBe(true);
    });

    it('should throw ForbiddenException for unauthorized IPs', () => {
      process.env.NODE_ENV = 'production';
      expect(() => service.validateWebhookIp('1.1.1.1')).toThrow();
    });
  });
});
