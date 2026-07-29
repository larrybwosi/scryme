import { invoke } from "@tauri-apps/api/core";

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
    return await invoke("open_shift_command", {
      cardId: cardId || undefined,
      pin: pin || undefined,
      floatAmount: Number(floatAmount || 0), // Ensure number type
      openingCashDetails,
      deviceId
    });
  },

  closeShift: async (cardId?: string | null, pin?: string | null, actualCount?: number, closingCashDetails?: any, printerName?: string): Promise<Shift> => {
    return await invoke("close_shift_command", {
      cardId: cardId || undefined,
      pin: pin || undefined,
      actualCount: Number(actualCount || 0),
      closingCashDetails,
      printerName
    });
  },

  addCashDrop: async (amount: number, reason: string): Promise<void> => {
    return await invoke("add_cash_drop_command", {
      amount: Number(amount),
      reason
    });
  }
};