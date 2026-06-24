import { processSale } from '../process.sale';
import { db } from '@repo/db';

jest.mock('@repo/db', () => ({
  db: {
    $transaction: jest.fn(),
    productVariant: {
      findMany: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    taxRate: {
        findMany: jest.fn(),
    },
    priceList: {
        findMany: jest.fn(),
    }
  },
  PaymentMethod: {
      CASH: 'CASH'
  },
  TransactionType: {
      POS_SALE: 'POS_SALE'
  },
  TransactionStatus: {
      COMPLETED: 'COMPLETED'
  },
  PaymentStatus: {
      PAID: 'PAID',
      UNPAID: 'UNPAID'
  },
  Prisma: {
      Decimal: jest.fn().mockImplementation((val) => ({
          toNumber: () => Number(val),
          mul: jest.fn().mockReturnThis(),
          add: jest.fn().mockReturnThis(),
          toNumberValue: Number(val)
      }))
  }
}));

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
      enableStockTracking: false,
    };

    const mockVariant = {
      id: 'var_1',
      name: 'Variant 1',
      sku: 'SKU1',
      retailPrice: 100,
      buyingPrice: 50,
      product: {
        name: 'Product 1',
      },
      sellingUnits: []
    };

    (db.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return await cb(db);
    });

    (db.organization.findUnique as jest.Mock).mockResolvedValue({ settings: {} });
    (db.productVariant.findMany as jest.Mock).mockResolvedValue([mockVariant]);
    (db.taxRate.findMany as jest.Mock).mockResolvedValue([]);
    (db.priceList.findMany as jest.Mock).mockResolvedValue([]);
    (db.transaction.create as jest.Mock).mockResolvedValue({
        id: 'txn_1',
        number: 'SALE-123'
    });

    const result = await processSale('org_1', mockData, 'member_1');

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('txn_1');
    expect(db.transaction.create).toHaveBeenCalled();
  });
});
