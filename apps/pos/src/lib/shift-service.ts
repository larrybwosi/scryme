import { invoke } from "@tauri-apps/api/core";
import { trackPosEvent, POS_EVENTS } from "@/lib/openpanel";

export interface Shift {
  id: string;
  opened_at: string;
  closed_at?: string;
  operator_id?: string;
  closing_operator_id?: string;
  starting_float: number;
  expected_cash: number;
  actual_cash?: number;
  variance?: number;
  total_cash_sales: number;
  total_cash_drops: number;
  total_cash_refunds: number;
  opening_cash_details?: any;
  closing_cash_details?: any;
}

export const shiftService = {
  getShiftStatus: async (): Promise<Shift | null> => {
    return await invoke("get_shift_command");
  },

  openShift: async (cardId?: string | null, pin?: string | null, floatAmount?: number, openingCashDetails?: any): Promise<Shift> => {
    const deviceId = localStorage.getItem('DEVICE_ID');
    const shift = await invoke<Shift>("open_shift_command", {
      cardId: cardId || undefined,
      pin: pin || undefined,
      floatAmount: Number(floatAmount || 0), // Ensure number type
      openingCashDetails,
      deviceId
    });

    trackPosEvent(POS_EVENTS.SHIFT_STARTED, {
      shiftId: shift.id,
      startingFloat: floatAmount || 0,
      openedAt: shift.opened_at,
    });

    if (floatAmount && floatAmount > 0) {
      trackPosEvent(POS_EVENTS.CASH_FLOAT_ADDED, {
        shiftId: shift.id,
        amount: floatAmount,
      });
    }

    return shift;
  },

  closeShift: async (cardId?: string | null, pin?: string | null, actualCount?: number, closingCashDetails?: any, printerName?: string): Promise<Shift> => {
    const shift = await invoke<Shift>("close_shift_command", {
      cardId: cardId || undefined,
      pin: pin || undefined,
      actualCount: Number(actualCount || 0),
      closingCashDetails,
      printerName
    });

    trackPosEvent(POS_EVENTS.SHIFT_ENDED, {
      shiftId: shift.id,
      expectedCash: shift.expected_cash,
      actualCash: actualCount || 0,
      variance: shift.variance,
      totalCashSales: shift.total_cash_sales,
    });

    return shift;
  },

  addCashDrop: async (amount: number, reason: string): Promise<void> => {
    await invoke("add_cash_drop_command", {
      amount: Number(amount),
      reason
    });

    trackPosEvent(POS_EVENTS.CASH_PAYOUT_LOGGED, {
      amount,
      reason,
    });
  }
};
