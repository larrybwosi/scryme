import { invoke } from '@tauri-apps/api/core';
import { usePosStore } from '@/store/store';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';

/**
 * Hook to interact with cash drawer hardware via Tauri commands.
 * Provides functions to open the physical cash drawer and list available serial ports.
 */
export function useCashDrawer() {
  const settings = usePosStore(state => state.settings);
  const [isOpening, setIsOpening] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);

  /**
   * Opens the physical cash drawer hardware.
   * Uses the configured serial port from settings.
   */
  const openPhysicalDrawer = useCallback(
    async (portOverride?: string) => {
      const port = portOverride ?? settings.cashDrawerPort;

      if (!port) {
        toast.error('No cash drawer port configured', {
          description: 'Please configure a serial port in Settings → Hardware',
        });
        return false;
      }

      if (!settings.enableCashDrawer) {
        console.log('[CashDrawer] Cash drawer disabled in settings');
        return false;
      }

      setIsOpening(true);
      try {
        const result = await invoke<string>('open_cash_drawer', { portName: port });
        console.log('[CashDrawer] Drawer opened:', result);
        return true;
      } catch (error) {
        console.error('[CashDrawer] Failed to open drawer:', error);
        toast.error('Failed to open cash drawer', {
          description: String(error),
        });
        return false;
      } finally {
        setIsOpening(false);
      }
    },
    [settings.cashDrawerPort, settings.enableCashDrawer]
  );

  /**
   * Fetches the list of available serial ports from the system.
   */
  const getSerialPorts = useCallback(async () => {
    setIsLoadingPorts(true);
    try {
      const ports = await invoke<string[]>('get_serial_ports');
      setAvailablePorts(ports);
      return ports;
    } catch (error) {
      console.error('[CashDrawer] Failed to list serial ports:', error);
      toast.error('Failed to detect serial ports', {
        description: String(error),
      });
      return [];
    } finally {
      setIsLoadingPorts(false);
    }
  }, []);

  return {
    openPhysicalDrawer,
    getSerialPorts,
    availablePorts,
    isOpening,
    isLoadingPorts,
  };
}
