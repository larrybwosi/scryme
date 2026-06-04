import { ShiftUseCase } from './shift.use-case';
import { Decimal } from 'decimal.js';

describe('ShiftUseCase', () => {
  let useCase: ShiftUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      client: {
        $transaction: vi.fn((cb) => cb(prisma.client)),
        attendanceLog: {
          findFirst: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        member: {
          update: vi.fn(),
        },
        transaction: {
          findMany: vi.fn(),
        },
        expense: {
          findMany: vi.fn(),
        },
      },
    };
    useCase = new ShiftUseCase(prisma as any);
  });

  it('should check out successfully and return a report', async () => {
    const mockCtx = {
      memberId: 'mem-1',
      organizationId: 'org-1',
      locationId: 'loc-1',
    };

    const mockLog = {
      id: 'log-1',
      memberId: 'mem-1',
      organizationId: 'org-1',
      checkInTime: new Date(Date.now() - 3600000),
      checkInLocationId: 'loc-1',
    };

    prisma.client.attendanceLog.findFirst.mockResolvedValue(mockLog);
    prisma.client.attendanceLog.update.mockResolvedValue({ ...mockLog, checkOutTime: new Date() });
    prisma.client.attendanceLog.findUnique.mockResolvedValue(mockLog);
    prisma.client.transaction.findMany.mockResolvedValue([]);
    prisma.client.expense.findMany.mockResolvedValue([]);

    const result = await useCase.checkOut(mockCtx as any);

    expect(result.success).toBe(true);
    expect(result.report).toBeDefined();
    expect(prisma.client.attendanceLog.update).toHaveBeenCalled();
    expect(prisma.client.member.update).toHaveBeenCalledWith({
      where: { id: 'mem-1' },
      data: { isCheckedIn: false, currentCheckInLocationId: null, currentAttendanceLogId: null },
    });
  });
});
