import { describe, it, expect } from 'vitest';
import { parseBarcodeEntry } from '../barcode-service';

describe('parseBarcodeEntry', () => {
  it('handles empty input gracefully', () => {
    const result = parseBarcodeEntry('');
    expect(result.cleanBarcode).toBe('');
    expect(result.quantity).toBe(1);
    expect(result.isVariableWeight).toBe(false);
  });

  it('parses standard barcodes with quantity 1', () => {
    const result = parseBarcodeEntry('6161100001234');
    expect(result.cleanBarcode).toBe('6161100001234');
    expect(result.quantity).toBe(1);
    expect(result.isVariableWeight).toBe(false);
  });

  it('parses multiplier prefix with asterisk (e.g. 5*123456)', () => {
    const result = parseBarcodeEntry('5*123456');
    expect(result.cleanBarcode).toBe('123456');
    expect(result.quantity).toBe(5);
    expect(result.isVariableWeight).toBe(false);
  });

  it('parses multiplier prefix with x or X (e.g. 12x987654321)', () => {
    const result = parseBarcodeEntry('12X987654321');
    expect(result.cleanBarcode).toBe('987654321');
    expect(result.quantity).toBe(12);
  });

  it('parses decimal multipliers (e.g. 2.5*123456)', () => {
    const result = parseBarcodeEntry('2.5*123456');
    expect(result.cleanBarcode).toBe('123456');
    expect(result.quantity).toBe(2.5);
  });

  it('parses EAN-13 variable weight barcode (prefix 20-29)', () => {
    const ean13 = '2100123150085';
    const parsed = parseBarcodeEntry(ean13);
    expect(parsed.isVariableWeight).toBe(true);
    expect(parsed.cleanBarcode).toBe(ean13);
    expect(parsed.itemCode).toBe('00123');
    expect(parsed.weightOrPrice).toBe(1.5);
    expect(parsed.quantity).toBe(1.5);
  });
});
