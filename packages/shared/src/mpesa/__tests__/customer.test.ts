import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeKenyanPhone, getPhoneSearchVariants, findOrCreateCustomerFromMpesa } from '../customer';
import { CustomerCreationType } from '@repo/db';
import * as automation from '../../services/automation';

vi.mock('server-only', () => ({}));

vi.mock('../../services/automation', () => ({
  emitCustomerCreated: vi.fn().mockResolvedValue('exec_123'),
}));

describe('M-Pesa Customer Helpers', () => {
  describe('normalizeKenyanPhone', () => {
    it('should normalize local Kenyan numbers starting with 07 or 01 to 254', () => {
      expect(normalizeKenyanPhone('0712345678')).toBe('254712345678');
      expect(normalizeKenyanPhone('0112345678')).toBe('254112345678');
    });

    it('should normalize 9-digit numbers starting with 7 or 1', () => {
      expect(normalizeKenyanPhone('712345678')).toBe('254712345678');
      expect(normalizeKenyanPhone('112345678')).toBe('254112345678');
    });

    it('should strip leading plus signs and spaces', () => {
      expect(normalizeKenyanPhone('+254712345678')).toBe('254712345678');
      expect(normalizeKenyanPhone('+254 712 345 678')).toBe('254712345678');
    });

    it('should handle already normalized 254 numbers', () => {
      expect(normalizeKenyanPhone('254712345678')).toBe('254712345678');
    });

    it('should return null for empty or null phone inputs', () => {
      expect(normalizeKenyanPhone(null)).toBeNull();
      expect(normalizeKenyanPhone(undefined)).toBeNull();
      expect(normalizeKenyanPhone('')).toBeNull();
    });
  });

  describe('getPhoneSearchVariants', () => {
    it('should generate standard phone variants for query lookup', () => {
      const variants = getPhoneSearchVariants('254712345678');
      expect(variants).toContain('254712345678');
      expect(variants).toContain('+254712345678');
      expect(variants).toContain('0712345678');
    });
  });

  describe('findOrCreateCustomerFromMpesa', () => {
    let mockTx: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockTx = {
        customer: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
      };
    });

    it('should return existing customer without creating a duplicate', async () => {
      const existingCustomer = {
        id: 'cust_existing_123',
        name: 'Jane Doe',
        phone: '254712345678',
        organizationId: 'org_123',
      };
      mockTx.customer.findFirst.mockResolvedValue(existingCustomer);

      const result = await findOrCreateCustomerFromMpesa(mockTx, {
        organizationId: 'org_123',
        phone: '0712345678',
        name: 'Jane D.',
      });

      expect(mockTx.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: 'org_123',
            phone: { in: expect.arrayContaining(['254712345678', '+254712345678', '0712345678']) },
          },
        })
      );
      expect(mockTx.customer.create).not.toHaveBeenCalled();
      expect(result).toBe(existingCustomer);
    });

    it('should create new customer with API_CREATED and dispatch emitCustomerCreated when customer is not found', async () => {
      mockTx.customer.findFirst.mockResolvedValue(null);
      const createdCustomer = {
        id: 'cust_new_456',
        name: 'John Doe',
        phone: '254712345678',
        organizationId: 'org_123',
      };
      mockTx.customer.create.mockResolvedValue(createdCustomer);

      const result = await findOrCreateCustomerFromMpesa(mockTx, {
        organizationId: 'org_123',
        phone: '0712345678',
        name: 'John Doe',
      });

      expect(mockTx.customer.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org_123',
          name: 'John Doe',
          phone: '254712345678',
          creationType: 'API_CREATED',
          isActive: true,
        },
      });
      expect(automation.emitCustomerCreated).toHaveBeenCalledWith('org_123', {
        customerId: 'cust_new_456',
        name: 'John Doe',
        email: undefined,
      });
      expect(result).toBe(createdCustomer);
    });

    it('should fallback to Customer {phone} when name is missing', async () => {
      mockTx.customer.findFirst.mockResolvedValue(null);
      mockTx.customer.create.mockImplementation(({ data }: { data: any }) => Promise.resolve({ id: 'cust_789', ...data }));

      const result = await findOrCreateCustomerFromMpesa(mockTx, {
        organizationId: 'org_123',
        phone: '0712345678',
      });

      expect(mockTx.customer.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org_123',
          name: 'Customer 254712345678',
          phone: '254712345678',
          creationType: 'API_CREATED',
          isActive: true,
        },
      });
      expect(result.name).toBe('Customer 254712345678');
    });
  });
});
