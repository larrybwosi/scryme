import { createWithEqualityFn as create } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { tauriStorage } from './storage-adapter';

interface ScannedItem {
  code: string;
  timestamp: string;
}

interface ScannerState {
  // Configuration
  vid: string;
  pid: string;
  setVid: (vid: string) => void;
  setPid: (pid: string) => void;

  // Operational State
  isConnected: boolean;
  isScanning: boolean; // True if the listener is active
  lastScanned: string | null;
  scanHistory: ScannedItem[];
  error: string | null;

  // Actions
  setIsConnected: (status: boolean) => void;
  setIsScanning: (status: boolean) => void;
  addScannedItem: (code: string) => void;
  setError: (error: string | null) => void;
  clearHistory: () => void;
  clearLastScanned: () => void;
}

export const useScannerStore = create<ScannerState>()(
  persist(
    set => ({
      // Defaults (Replace with your most common device)
      vid: '0xE851',
      pid: '0x2100',

      isConnected: false,
      isScanning: false,
      lastScanned: null,
      scanHistory: [],
      error: null,

      setVid: vid => set({ vid }),
      setPid: pid => set({ pid }),

      setIsConnected: isConnected => set({ isConnected }),
      setIsScanning: isScanning => set({ isScanning }),

      addScannedItem: code =>
        set(state => ({
          lastScanned: code,
          // Keep the last 50 items only to prevent memory bloat
          scanHistory: [{ code, timestamp: new Date().toLocaleTimeString() }, ...state.scanHistory].slice(0, 50),
        })),

      setError: error => set({ error }),

      clearHistory: () => set({ scanHistory: [], lastScanned: null }),

      clearLastScanned: () => set({ lastScanned: null }),
    }),
    {
      name: 'scanner-config', // Key name inside the JSON file
      storage: createJSONStorage(() => tauriStorage),
      partialize: state => ({ vid: state.vid, pid: state.pid }),
    }
  )
);
