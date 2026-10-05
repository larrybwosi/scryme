import { create } from 'zustand';

interface UiState {
  paymentDialogOpen: boolean;
  shortcutsHelpDialogOpen: boolean;
  holdOrderDialogOpen: boolean;
  prescriptionDialogOpen: boolean;
  customOrderDialogOpen: boolean;

  setPaymentDialogOpen: (open: boolean) => void;
  setShortcutsHelpDialogOpen: (open: boolean) => void;
  setHoldOrderDialogOpen: (open: boolean) => void;
  setPrescriptionDialogOpen: (open: boolean) => void;
  setCustomOrderDialogOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  paymentDialogOpen: false,
  shortcutsHelpDialogOpen: false,
  holdOrderDialogOpen: false,
  prescriptionDialogOpen: false,
  customOrderDialogOpen: false,

  setPaymentDialogOpen: (open) => set({ paymentDialogOpen: open }),
  setShortcutsHelpDialogOpen: (open) => set({ shortcutsHelpDialogOpen: open }),
  setHoldOrderDialogOpen: (open) => set({ holdOrderDialogOpen: open }),
  setPrescriptionDialogOpen: (open) => set({ prescriptionDialogOpen: open }),
  setCustomOrderDialogOpen: (open) => set({ customOrderDialogOpen: open }),
}));
