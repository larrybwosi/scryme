import { describe, it, expect, vi, Mock } from 'vitest';
import { processSale } from '../process.sale';
import { db } from '@repo/db';

vi.mock('@repo/db', () => {
  class MockDecimal {
    constructor(public val: any) {}
    toString() { return String(this.val); }
    toFixed(digits?: number) { return Number(this.val).toFixed(digits ?? 2); }
    toNumber() { return Number(this.val); }
    plus(other: any) { return new MockDecimal(Number(this.val) + Number(other?.val ?? other)); }
    minus(other: any) { return new MockDecimal(Number(this.val) - Number(other?.val ?? other)); }
    sub(other: any) { return new MockDecimal(Number(this.val) - Number(other?.val ?? other)); }
    add(other: any) { return new MockDecimal(Number(this.val) + Number(other?.val ?? other)); }
    mul(other: any) { return new MockDecimal(Number(this.val) * Number(other?.val ?? other)); }
    times(other: any) { return new MockDecimal(Number(this.val) * Number(other?.val ?? other)); }
    div(other: any) { return new MockDecimal(Number(this.val) / Number(other?.val ?? other)); }
    dividedBy(other: any) { return new MockDecimal(Number(this.val) / Number(other?.val ?? other)); }
    toDecimalPlaces() { return this; }
    greaterThan(other: any) { return Number(this.val) > Number(other?.val ?? other); }
    greaterThanOrEqualTo(other: any) { return Number(this.val) >= Number(other?.val ?? other); }
    equals(other: any) { return Number(this.val) === Number(other?.val ?? other); }
    gt(other: any) { return Number(this.val) > Number(other?.val ?? other); }
  }

  const mockDb = {
    $transaction: vi.fn(),
    organization: {
      findUnique: vi.fn(),
    },
    organizationSettings: {
      findUnique: vi.fn(),
    },
    inventoryLocation: {
      findFirst: vi.fn(),
    },
    taxRate: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    priceList: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    productVariant: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    transaction: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    fulfillment: {
      create: vi.fn().mockResolvedValue({ id: 'ful_1' }),
    },
    fulfillmentItem: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    unclaimedPayment: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };

  return {
    Prisma: {
      Decimal: MockDecimal,
    },
    db: mockDb,
    prisma: mockDb,
    PaymentMethod: {
      CASH: 'CASH',
      MPESA: 'MPESA',
    },
    TransactionType: {
      POS_SALE: 'POS_SALE',
    },
    TransactionStatus: {
      COMPLETED: 'COMPLETED',
      PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
    },
    PaymentStatus: {
      PAID: 'PAID',
      COMPLETED: 'COMPLETED',
      PENDING: 'PENDING',
      PARTIALLY_PAID: 'PARTIALLY_PAID',
    },
    FulfillmentType: {
      IMMEDIATE: 'IMMEDIATE',
    },
    FulfillmentStatus: {
      COMPLETED: 'COMPLETED',
    },
  };
});

describe('processSale Action', () => {
  it('should process a sale successfully', async () => {
    const mockData: any = {
      cartItems: [
        {
          variantId: 'var_1',
          quantity: 2,
          sellingUnitId: 'unit_1',
        },
      ],
      locationId: 'loc_1',
      payments: [
        {
          method: 'CASH',
          amount: 200,
        },
      ],
      discountAmount: 0,
      enableStockTracking: false,
    };

    const mockVariant = {
      id: 'var_1',
      name: 'Variant 1',
      sku: 'SKU1',
      retailPrice: 100,
      buyingPrice: 50,
      product: {
        id: 'prod_1',
        name: 'Product 1',
        organizationId: 'org_1',
      },
      sellingUnits: [],
    };

    (db.organization.findUnique as Mock).mockResolvedValue({
      settings: {
        negativeStock: false,
        inventoryPolicy: 'FEFO',
        defaultCurrency: 'USD',
      },
    });

    (db.$transaction as Mock).mockImplementation(async (cb) => {
      return await cb(db);
    });

    (db.productVariant.findMany as Mock).mockResolvedValue([mockVariant]);
    (db.transaction.create as Mock).mockResolvedValue({
      id: 'txn_1',
      number: 'SALE-123',
      type: 'POS_SALE',
      status: 'COMPLETED',
      finalTotal: 200,
      createdAt: new Date(),
      items: [
        { sku: 'SKU1', quantity: 2, unitPrice: { toNumber: () => 100 } }
      ]
    });

    (db.transaction.findFirst as Mock).mockResolvedValue({
      id: 'txn_1',
      number: 'SALE-123',
      customer: { name: 'Walk-in Customer' },
    });

    const result = await processSale('org_1', 'member_1', mockData);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('txn_1');
    expect(db.transaction.create).toHaveBeenCalled();
  });
});
