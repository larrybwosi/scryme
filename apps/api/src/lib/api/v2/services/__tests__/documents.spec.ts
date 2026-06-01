import { getDocumentStream } from '../documents';
import { prisma } from '@repo/db';
import * as renderer from '@react-pdf/renderer';

vi.mock('@repo/db', () => {
  const mockFindFirst = vi.fn();
  return {
    prisma: {
      transaction: {
        findFirst: mockFindFirst,
      },
    },
    PrismaClient: vi.fn().mockImplementation(() => ({
        transaction: {
            findFirst: mockFindFirst,
        }
    }))
  };
});

vi.mock('@react-pdf/renderer', () => ({
  renderToStream: vi.fn().mockResolvedValue('mock-stream'),
}));

vi.mock('@repo/documents/v2/InvoiceTemplate', () => ({
  InvoiceTemplate: () => null,
}));

vi.mock('@repo/documents/v2/ReceiptTemplate', () => ({
  ReceiptTemplate: () => null,
}));

describe('Documents Service', () => {
  it('should return a stream for an invoice', async () => {
    const { PrismaClient } = (await import('@repo/db')) as any;
    const mockPrisma = new PrismaClient();
    const mockTransaction = {
      id: 'txn_1',
      number: 'INV-001',
      organization: { settings: {} },
      customer: { addresses: [] },
      items: [],
      payments: [],
      location: {},
    };

    vi.mocked(mockPrisma.transaction.findFirst).mockResolvedValue(mockTransaction as any);

    const result = await getDocumentStream('invoice', 'txn_1', 'org_1');

    expect(result.stream).toBe('mock-stream');
    expect(result.filename).toBe('Invoice_INV-001.pdf');
    expect(result.contentType).toBe('application/pdf');
  });

  it('should throw error if transaction not found', async () => {
    const { PrismaClient } = (await import('@repo/db')) as any;
    const mockPrisma = new PrismaClient();
    vi.mocked(mockPrisma.transaction.findFirst).mockResolvedValue(null as any);

    await expect(getDocumentStream('invoice', 'txn_2', 'org_1')).rejects.toThrow('Transaction not found');
  });
});
