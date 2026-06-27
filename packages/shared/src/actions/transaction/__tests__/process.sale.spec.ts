import { processSale } from "../process.sale";
import { db } from "@repo/db";
import { Decimal } from "decimal.js";

jest.mock("@repo/db", () => ({
  prisma: {
    $transaction: jest.fn(),
    productVariant: {
      findUnique: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  },
  PaymentMethod: {
    CASH: "CASH",
  },
  TransactionType: {
    POS_SALE: "POS_SALE",
  },
  TransactionStatus: {
    COMPLETED: "COMPLETED",
  },
  PaymentStatus: {
    PAID: "PAID",
    COMPLETED: "COMPLETED",
  },
}));

describe("processSale Action", () => {
  it("should process a sale successfully", async () => {
    const mockData: any = {
      cartItems: [
        {
          variantId: "var_1",
          quantity: 2,
          sellingUnitId: "unit_1",
        },
      ],
      locationId: "loc_1",
      payments: [
        {
          method: "CASH",
          amount: 200,
        },
      ],
      discountAmount: 0,
    };

    const mockVariant = {
      id: "var_1",
      name: "Variant 1",
      sku: "SKU1",
      retailPrice: 100,
      buyingPrice: 50,
      product: {
        name: "Product 1",
      },
    };

    (db.$transaction as jest.Mock).mockImplementation(async (cb) => {
      return await cb(db);
    });

    (db.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);
    (db.transaction.create as jest.Mock).mockResolvedValue({
      id: "txn_1",
      number: "SALE-123",
    });

    const result = await processSale("org_1", "member_1", mockData);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe("txn_1");
    expect(db.transaction.create).toHaveBeenCalled();
  });
});
