import { invoke } from '@tauri-apps/api/core';

export interface PrinterResponse {
  success: boolean;
  message: string;
}

export const PrinterService = {
  async printNetwork(ip: string, content: string): Promise<PrinterResponse> {
    try {
      const msg = await invoke<string>('print_network_receipt', { ip, text: content });
      return { success: true, message: msg };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async printSystem(printerName: string, content: string): Promise<PrinterResponse> {
    try {
      const msg = await invoke<string>('print_system_receipt', { printerName, text: content });
      return { success: true, message: msg };
    } catch (err) {
      console.error(err);
      return { success: false, message: String(err) };
    }
  },

  async printUsb(vid: number, pid: number, content: string): Promise<PrinterResponse> {
    try {
      const msg = await invoke<string>('print_usb', { vid, pid, text: content });
      return { success: true, message: msg };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },
};
