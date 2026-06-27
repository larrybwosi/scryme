import { useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useScannerStore } from '@/store/barcode-scanner';

interface ScanPayload {
  message: string;
  source: string;
}

export const useScanner = () => {
  // We keep this so components using the hook still re-render when UI state changes
  const store = useScannerStore();

  const isMounted = useRef(false);
  const unlisteners = useRef<UnlistenFn[]>([]);

  const stopScanner = useCallback(() => {
    unlisteners.current.forEach(fn => fn());
    unlisteners.current = [];

    // Use getState() to avoid adding state to dependency array
    const { setIsScanning, setIsConnected } = useScannerStore.getState();
    setIsScanning(false);
    setIsConnected(false);
  }, []);

  const startScanner = useCallback(async () => {
    // 1. Read the fresh state directly when the function is called
    const state = useScannerStore.getState();

    if (state.isScanning) return;

    if (!state.vid || !state.pid) {
      state.setError('Vendor ID and Product ID are missing.');
      return;
    }

    state.setError(null);

    try {
      const unlistenData = await listen<ScanPayload>('scanner-data', event => {
        console.log(`[${event.payload.source}] Barcode Received:`, event.payload.message);
        // 2. Use getState() inside listeners to prevent stale closures
        useScannerStore.getState().addScannedItem(event.payload.message);
      });
      unlisteners.current.push(unlistenData);

      const unlistenStatus = await listen<string>('scanner-status', event => {
        const status = event.payload;
        const { setIsConnected } = useScannerStore.getState();

        if (status.includes('Connected') || status.includes('Listening')) {
          setIsConnected(true);
        }
        if (status.includes('Disconnected')) {
          setIsConnected(false);
        }
      });
      unlisteners.current.push(unlistenStatus);

      const unlistenError = await listen<string>('scanner-error', event => {
        const { setError, setIsConnected } = useScannerStore.getState();
        setError(event.payload);
        setIsConnected(false);
      });
      unlisteners.current.push(unlistenError);

      await invoke('start_scan', {
        vid_hex: state.vid,
        pid_hex: state.pid,
      });

      // 3. Update state at the end
      useScannerStore.getState().setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      const { setError, setIsScanning } = useScannerStore.getState();
      setError(typeof err === 'string' ? err : 'Unknown error');
      setIsScanning(false);
      stopScanner();
    }
  }, [stopScanner]); // Only depends on stopScanner, which is safely memoized

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  return { startScanner, stopScanner, ...store };
};
