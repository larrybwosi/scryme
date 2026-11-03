vi.mock('server-only', () => ({}));
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { MpesaService, safeDecryptCredential } from '../service';
import { db } from '@repo/db';
import { realtimeService } from '../../realtime';

vi.mock('@repo/db', () => ({
  CustomerCreationType: { API_CREATED: 'API_CREATED', MEMBER_CREATED: 'MEMBER_CREATED' },
  db: {
    paymentCredentials: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    transaction: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    mpesaPaymentRequest: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    unclaimedPayment: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      updateMany: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(db)),
  },
}));

vi.mock('../../api/v2', () => ({
  decrypt: vi.fn((val) => Promise.resolve(val)),
}));

vi.mock('../../realtime', () => ({
  realtimeService: {
    publish: vi.fn(),
  },
}));

vi.mock('../client');

describe('MpesaService', () => {
  let service: MpesaService;

  beforeEach(() => {
    service = new MpesaService();
    vi.clearAllMocks();
  });

  describe('safeDecryptCredential', () => {
    it('should return empty string for null or undefined', () => {
      expect(safeDecryptCredential(null)).toBe('');
      expect(safeDecryptCredential(undefined)).toBe('');
    });

    it('should fallback to raw string if decryption fails or text is unencrypted', () => {
      expect(safeDecryptCredential('raw_plain_text_credential')).toBe('raw_plain_text_credential');
    });
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

      (db.paymentCredentials.findFirst as Mock).mockResolvedValue({ organizationId: 'org_123' });
      (db.transaction.findFirst as Mock).mockResolvedValue(mockTransaction);
      (db.payment.findFirst as Mock).mockResolvedValue(null);
      (db.payment.create as Mock).mockResolvedValue({ id: 'pay_123' });
      (db.transaction.update as Mock).mockResolvedValue({
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
      (db.paymentCredentials.findFirst as Mock).mockResolvedValue({ organizationId: 'org_123' });
      (db.transaction.findFirst as Mock).mockResolvedValue(null);
      (db.unclaimedPayment.upsert as Mock).mockResolvedValue({ id: 'unclaimed_123' });

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
      (db.payment.findFirst as Mock).mockResolvedValue({
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
      (db.payment.findFirst as Mock).mockResolvedValue(null);
      (db.transaction.findFirst as Mock).mockResolvedValue({ id: 'tx_123', number: 'ORD-123', paymentStatus: 'UNPAID' });
      (db.mpesaPaymentRequest.findFirst as Mock).mockResolvedValue({
        status: 'PENDING',
        checkoutRequestId: 'ws_123',
      });

      const result = await service.verifyPayment('tx_123');

      expect(result.status).toBe('PROCESSING');
      expect(result.checkoutRequestId).toBe('ws_123');
    });

    it('should return UNCLAIMED_FOUND if a matching unclaimed payment exists', async () => {
        (db.payment.findFirst as Mock).mockResolvedValue(null);
        (db.transaction.findFirst as Mock).mockResolvedValue({ id: 'tx_123', number: 'ORD-123', paymentStatus: 'UNPAID' });
        (db.mpesaPaymentRequest.findFirst as Mock).mockResolvedValue(null);
        (db.unclaimedPayment.findFirst as Mock).mockResolvedValue({
            transId: 'REC456',
            amount: 500,
            billRefNumber: 'ORD-123'
        });

        const result = await service.verifyPayment('tx_123');

        expect(result.status).toBe('UNCLAIMED_FOUND');
        expect(result.receipt).toBe('REC456');
    });
  });

  describe('security - multi-tenant isolation', () => {
    it('validate should NOT return unclaimed payments from other organizations (IDOR)', async () => {
      (db.payment.findFirst as Mock).mockResolvedValue(null);
      (db.unclaimedPayment.findFirst as Mock).mockResolvedValue({
        id: 'unclaimed_456',
        transId: 'REC999',
        organizationId: 'other_org',
      });

      const result = await service.validate({
        transactionCode: 'REC999',
        organizationId: 'my_org',
      });

      expect(db.unclaimedPayment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'my_org',
          }),
        }),
      );
    });

    it('verifyPayment should NOT return unclaimed payments from other organizations', async () => {
      (db.payment.findFirst as Mock).mockResolvedValue(null);
      (db.transaction.findFirst as Mock).mockResolvedValue({
        id: 'tx_123',
        number: 'ORD-123',
        organizationId: 'my_org',
        paymentStatus: 'UNPAID',
      });
      (db.mpesaPaymentRequest.findFirst as Mock).mockResolvedValue(null);
      (db.unclaimedPayment.findFirst as Mock).mockResolvedValue({
        transId: 'REC456',
        organizationId: 'other_org',
      });

      await service.verifyPayment('tx_123', 'my_org');

      expect(db.unclaimedPayment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'my_org',
          }),
        }),
      );
    });

    it('verifyPayment should NOT return payment requests from other organizations', async () => {
      (db.payment.findFirst as Mock).mockResolvedValue(null);
      (db.transaction.findFirst as Mock).mockResolvedValue({
        id: 'tx_123',
        number: 'ORD-123',
        organizationId: 'my_org',
        paymentStatus: 'UNPAID',
      });
      (db.mpesaPaymentRequest.findFirst as Mock).mockResolvedValue({
        status: 'PENDING',
        organizationId: 'other_org',
      });

      await service.verifyPayment('tx_123', 'my_org');

      expect(db.mpesaPaymentRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'my_org',
          }),
        }),
      );
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

      (db.payment.update as Mock).mockResolvedValue({ id: 'pay_123', transactionId: 'tx_123' });

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
      expect(service.validateWebhookIp('196.201.214.50')).toBe(true);
      expect(service.validateWebhookIp('::ffff:196.201.214.200')).toBe(true);
    });

    it('should throw ForbiddenException for unauthorized IPs', () => {
      process.env.NODE_ENV = 'production';
      expect(() => service.validateWebhookIp('1.1.1.1')).toThrow();
    });
  });

  describe('claimPayment', () => {
    it('should scope UnclaimedPayment and Transaction lookups to organizationId', async () => {
      const unclaimedPaymentId = 'unclaimed_123';
      const transactionId = 'tx_123';
      const organizationId = 'org_123';
      const memberId = 'mem_123';

      const mockUnclaimed = {
        id: unclaimedPaymentId,
        organizationId,
        amount: 100,
        claimed: false,
        transId: 'REC123',
        msisdn: '254712345678',
      };

      const mockTransaction = {
        id: transactionId,
        organizationId,
        number: 'ORD-123',
      };

      (db.unclaimedPayment.findFirst as Mock).mockResolvedValue(mockUnclaimed);
      (db.transaction.findFirst as Mock).mockResolvedValue(mockTransaction);
      (db.payment.create as Mock).mockResolvedValue({ id: 'pay_123' });
      (db.unclaimedPayment.update as Mock).mockResolvedValue({});
      (db.transaction.update as Mock).mockResolvedValue({ ...mockTransaction, finalTotal: 1000, totalPaid: 0 });

      await service.claimPayment(organizationId, unclaimedPaymentId, transactionId, memberId);

      expect(db.unclaimedPayment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: unclaimedPaymentId, organizationId }
      }));
      expect(db.transaction.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: transactionId, organizationId }
      }));
    });

    it('should throw error if unclaimed payment belongs to another organization', async () => {
      (db.unclaimedPayment.findFirst as Mock).mockResolvedValue(null);

      await expect(service.claimPayment('org_123', 'unclaimed_456', 'tx_123', 'mem_123'))
        .rejects.toThrow('Unclaimed payment not found');
    });
  });
});

  describe('Customer Tracking & Auto-Saving across M-Pesa Flows', () => {
    let service: MpesaService;
    beforeEach(() => {
      service = new MpesaService();
      vi.clearAllMocks();
    });

    it('handleC2BConfirmation creates customer and links to transaction when customerId is unset', async () => {
      const mockTransaction = {
        id: 'tx_c2b_1',
        number: 'ORD-C2B-1',
        organizationId: 'org_123',
        customerId: null,
        totalPaid: 0,
        finalTotal: 1000,
        status: 'DRAFT',
      };

      (db.paymentCredentials.findFirst as Mock).mockResolvedValue({ organizationId: 'org_123' });
      (db.transaction.findFirst as Mock).mockResolvedValue(mockTransaction);
      (db.transaction.findUnique as Mock).mockResolvedValue(mockTransaction);
      (db.customer.findFirst as Mock).mockResolvedValue(null);
      (db.customer.create as Mock).mockResolvedValue({
        id: 'cust_auto_1',
        name: 'Alice Wambui',
        phone: '254712345678',
        organizationId: 'org_123',
      });
      (db.payment.findFirst as Mock).mockResolvedValue(null);
      (db.payment.create as Mock).mockResolvedValue({ id: 'pay_c2b_1' });
      (db.transaction.update as Mock).mockResolvedValue({
        ...mockTransaction,
        customerId: 'cust_auto_1',
        totalPaid: 500,
      });

      const payload = {
        TransactionType: 'Pay Bill',
        TransID: 'MPESA_C2B_REC_1',
        TransTime: '20230525141521',
        TransAmount: '500.00',
        BusinessShortCode: '174379',
        BillRefNumber: 'ORD-C2B-1',
        MSISDN: '254712345678',
        FirstName: 'Alice',
        LastName: 'Wambui',
      };

      await service.handleC2BConfirmation(payload);

      expect(db.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org_123',
          name: 'Alice Wambui',
          phone: '254712345678',
          creationType: 'API_CREATED',
        }),
      });

      expect(db.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'cust_auto_1',
          payerPhone: '254712345678',
          payerName: 'Alice Wambui',
        }),
      });

      expect(db.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tx_c2b_1' },
          data: expect.objectContaining({
            customerId: 'cust_auto_1',
            totalPaid: { increment: 500 },
          }),
        })
      );
    });

    it('handleC2BConfirmation preserves existing transaction customerId', async () => {
      const mockTransaction = {
        id: 'tx_c2b_2',
        number: 'ORD-C2B-2',
        organizationId: 'org_123',
        customerId: 'existing_cust_preserve',
        totalPaid: 0,
        finalTotal: 1000,
        status: 'DRAFT',
      };

      (db.paymentCredentials.findFirst as Mock).mockResolvedValue({ organizationId: 'org_123' });
      (db.transaction.findFirst as Mock).mockResolvedValue(mockTransaction);
      (db.transaction.findUnique as Mock).mockResolvedValue(mockTransaction);
      (db.customer.findFirst as Mock).mockResolvedValue({
        id: 'cust_payer_diff',
        name: 'Bob Payer',
        phone: '254799999999',
        organizationId: 'org_123',
      });
      (db.payment.findFirst as Mock).mockResolvedValue(null);
      (db.payment.create as Mock).mockResolvedValue({ id: 'pay_c2b_2' });
      (db.transaction.update as Mock).mockResolvedValue({
        ...mockTransaction,
        totalPaid: 300,
      });

      const payload = {
        TransactionType: 'Pay Bill',
        TransID: 'MPESA_C2B_REC_2',
        TransTime: '20230525141521',
        TransAmount: '300.00',
        BusinessShortCode: '174379',
        BillRefNumber: 'ORD-C2B-2',
        MSISDN: '254799999999',
        FirstName: 'Bob',
      };

      await service.handleC2BConfirmation(payload);

      // Customer on transaction was not overwritten
      expect(db.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx_c2b_2' },
        data: {
          totalPaid: { increment: 300 },
        },
      });
    });

    it('handleStkCallback resolves customer and links to transaction when paid', async () => {
      const mockPayment = {
        id: 'pay_stk_1',
        transactionId: 'tx_stk_1',
        organizationId: 'org_123',
        payerPhone: '254711223344',
      };
      const mockTransaction = {
        id: 'tx_stk_1',
        customerId: null,
        totalPaid: 0,
        finalTotal: 500,
        status: 'PENDING',
      };

      (db.payment.update as Mock).mockResolvedValue(mockPayment);
      (db.transaction.findUnique as Mock).mockResolvedValue(mockTransaction);
      (db.customer.findFirst as Mock).mockResolvedValue(null);
      (db.customer.create as Mock).mockResolvedValue({
        id: 'cust_stk_1',
        name: 'Customer 254711223344',
        phone: '254711223344',
        organizationId: 'org_123',
      });
      (db.transaction.update as Mock).mockResolvedValue({
        ...mockTransaction,
        customerId: 'cust_stk_1',
        totalPaid: 500,
      });

      const stkPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'm_123',
            CheckoutRequestID: 'ws_co_123',
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 500 },
                { Name: 'MpesaReceiptNumber', Value: 'QWE123RTY' },
                { Name: 'PhoneNumber', Value: 254711223344 },
              ],
            },
          },
        },
      };

      await service.handleStkCallback('org_123', 'pay_stk_1', stkPayload);

      expect(db.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org_123',
          name: 'Customer 254711223344',
          phone: '254711223344',
          creationType: 'API_CREATED',
        }),
      });

      expect(db.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tx_stk_1' },
          data: expect.objectContaining({
            customerId: 'cust_stk_1',
            totalPaid: { increment: 500 },
          }),
        })
      );
    });

    it('claimPayment resolves customer from unclaimed record and links to transaction', async () => {
      const mockUnclaimed = {
        id: 'unclaimed_99',
        organizationId: 'org_123',
        amount: 250,
        transId: 'REC_UNCLAIMED_99',
        msisdn: '254700112233',
        firstName: 'Carol',
        lastName: 'Danvers',
        billRefNumber: 'BILL_REF_99',
        claimed: false,
      };

      const mockTransaction = {
        id: 'tx_claim_1',
        organizationId: 'org_123',
        customerId: null,
        totalPaid: 0,
        finalTotal: 500,
        status: 'PENDING',
      };

      (db.unclaimedPayment.findFirst as Mock).mockResolvedValue(mockUnclaimed);
      (db.transaction.findFirst as Mock).mockResolvedValue(mockTransaction);
      (db.transaction.findUnique as Mock).mockResolvedValue(mockTransaction);
      (db.customer.findFirst as Mock).mockResolvedValue(null);
      (db.customer.create as Mock).mockResolvedValue({
        id: 'cust_claim_1',
        name: 'Carol Danvers',
        phone: '254700112233',
        organizationId: 'org_123',
      });
      (db.payment.create as Mock).mockResolvedValue({ id: 'pay_claim_1' });
      (db.unclaimedPayment.update as Mock).mockResolvedValue({});
      (db.transaction.update as Mock).mockResolvedValue({
        ...mockTransaction,
        customerId: 'cust_claim_1',
        totalPaid: 250,
      });

      await service.claimPayment('org_123', 'unclaimed_99', 'tx_claim_1', 'user_123');

      expect(db.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org_123',
          name: 'Carol Danvers',
          phone: '254700112233',
          creationType: 'API_CREATED',
        }),
      });

      expect(db.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'cust_claim_1',
          payerPhone: '254700112233',
          payerName: 'Carol Danvers',
        }),
      });

      expect(db.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tx_claim_1' },
          data: expect.objectContaining({
            customerId: 'cust_claim_1',
            totalPaid: { increment: 250 },
          }),
        })
      );
    });
  });
