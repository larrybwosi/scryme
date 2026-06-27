import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BarcodeService } from '../barcode-service';
import bwipjs from 'bwip-js';

// Mock bwip-js
vi.mock('bwip-js', () => ({
  default: {
    toCanvas: vi.fn(),
  },
}));

describe('BarcodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock document.createElement for canvas
    const mockCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock-barcode'),
    };
    if (typeof global.document === 'undefined') {
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };
    } else {
      global.document.createElement = vi.fn().mockReturnValue(mockCanvas);
    }
  });

  it('should generate a barcode', async () => {
    const result = await BarcodeService.generate('12345678', 'code128');

    expect(bwipjs.toCanvas).toHaveBeenCalled();
    expect(result).toBe('data:image/png;base64,mock-barcode');
  });

  it('should validate EAN-13 barcodes', () => {
    expect(BarcodeService.isValid('1234567890123', 'ean13')).toBe(true);
    expect(BarcodeService.isValid('123', 'ean13')).toBe(false);
  });

  it('should throw error if text is missing', async () => {
    await expect(BarcodeService.generate('', 'code128')).rejects.toThrow('Barcode text is required');
  });
});
