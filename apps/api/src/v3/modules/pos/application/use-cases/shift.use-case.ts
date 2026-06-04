import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { V3ApiContext } from '@repo/shared/server';
import { Decimal } from 'decimal.js';

@Injectable()
export class ShiftUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async checkOut(ctx: V3ApiContext) {
    const memberId = ctx.memberId;
    if (!memberId) {
      throw new BadRequestException('Member context missing for checkout.');
    }

    return this.prisma.client.$transaction(async tx => {
      // 1. Find the active attendance log
      const activeLog = await tx.attendanceLog.findFirst({
        where: {
          memberId,
          organizationId: ctx.organizationId,
          checkOutTime: null,
        },
      });

      if (!activeLog) {
        throw new NotFoundException('No active shift found for this member.');
      }

      // 2. Close the attendance log
      const updatedLog = await tx.attendanceLog.update({
        where: { id: activeLog.id },
        data: {
          checkOutTime: new Date(),
          checkOutLocationId: ctx.locationId || activeLog.checkInLocationId,
        },
      });

      // 3. Update member status
      await tx.member.update({
        where: { id: memberId },
        data: {
          isCheckedIn: false,
          currentCheckInLocationId: null,
          currentAttendanceLogId: null,
        },
      });

      // 4. Generate summary for the closed shift
      const report = await this.getShiftSummary(tx, activeLog.id);

      return {
        success: true,
        checkOutTime: updatedLog.checkOutTime,
        report,
      };
    });
  }

  async getShiftReport(ctx: V3ApiContext) {
    const memberId = ctx.memberId;
    if (!memberId) {
      throw new BadRequestException('Member context missing.');
    }

    // Find the current or most recent log
    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: {
        memberId,
        organizationId: ctx.organizationId,
      },
      orderBy: { checkInTime: 'desc' },
    });

    if (!activeLog) {
      throw new NotFoundException('No shift history found.');
    }

    return this.getShiftSummary(this.prisma.client, activeLog.id);
  }

  private async getShiftSummary(tx: any, attendanceLogId: string) {
    const log = await tx.attendanceLog.findUnique({
      where: { id: attendanceLogId },
    });

    if (!log) return null;

    const startTime = log.checkInTime;
    const endTime = log.checkOutTime || new Date();

    // 1. Get sales during this period by this member
    const sales = await tx.transaction.findMany({
      where: {
        organizationId: log.organizationId,
        memberId: log.memberId,
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
        type: 'SALE',
      },
      include: {
        payments: true,
      },
    });

    // 2. Aggregate sales by payment method
    const paymentSummary: Record<string, Decimal> = {};
    let totalSales = new Decimal(0);

    sales.forEach((s: any) => {
      totalSales = totalSales.plus(s.totalAmount);
      s.payments.forEach((p: any) => {
        const method = p.method || 'OTHER';
        paymentSummary[method] = (paymentSummary[method] || new Decimal(0)).plus(p.amount);
      });
    });

    // 3. Get petty cash expenses
    const expenses = await tx.expense.findMany({
      where: {
        organizationId: log.organizationId,
        createdBy: log.memberId,
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
        pettyCashId: { not: null },
      },
    });

    const totalExpenses = expenses.reduce(
      (sum: Decimal, e: any) => sum.plus(new Decimal(e.amount.toString())),
      new Decimal(0)
    );

    return {
      startTime,
      endTime,
      isClosed: !!log.checkOutTime,
      totalSales: totalSales.toNumber(),
      paymentSummary: Object.fromEntries(
        Object.entries(paymentSummary).map(([k, v]) => [k, v.toNumber()])
      ),
      totalPettyCashExpenses: totalExpenses.toNumber(),
      transactionCount: sales.length,
      expenseCount: expenses.length,
    };
  }
}
