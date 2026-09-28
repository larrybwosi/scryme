import { describe, it, expect } from 'vitest';
import { formatVariantName, getVariantDisplayName } from '../lib/utils';

describe('formatVariantName', () => {
  it('returns Product Name when variant name is "Default"', () => {
    expect(formatVariantName('Sourdough Bread', 'Default')).toBe('Sourdough Bread');
    expect(formatVariantName('Sourdough Bread', 'default')).toBe('Sourdough Bread');
    expect(formatVariantName('Sourdough Bread', 'DEFAULT')).toBe('Sourdough Bread');
  });

  it('returns "Product Name - Variant Name" when variant name is not "Default"', () => {
    expect(formatVariantName('Wheat Flour', '25kg Bag')).toBe('Wheat Flour - 25kg Bag');
    expect(formatVariantName('French Baguette', 'Small')).toBe('French Baguette - Small');
  });

  it('returns Product Name when variant name is empty, whitespace, or undefined', () => {
    expect(formatVariantName('Croissant', '')).toBe('Croissant');
    expect(formatVariantName('Croissant', '   ')).toBe('Croissant');
    expect(formatVariantName('Croissant', null)).toBe('Croissant');
    expect(formatVariantName('Croissant', undefined)).toBe('Croissant');
  });

  it('returns Variant Name when product name is empty or undefined and variant is not Default', () => {
    expect(formatVariantName(undefined, '500g')).toBe('500g');
    expect(formatVariantName('', '500g')).toBe('500g');
    expect(formatVariantName(null, '500g')).toBe('500g');
  });

  it('falls back to Default when product name is empty and variant name is Default', () => {
    expect(formatVariantName('', 'Default')).toBe('Default');
    expect(formatVariantName(undefined, 'Default')).toBe('Default');
    expect(formatVariantName('', '')).toBe('');
  });
});

describe('getVariantDisplayName', () => {
  it('formats variant objects correctly', () => {
    const defaultVariant = {
      name: 'Default',
      product: { name: 'Chocolate Cake' },
    };
    expect(getVariantDisplayName(defaultVariant)).toBe('Chocolate Cake');

    const customVariant = {
      name: 'Slice',
      product: { name: 'Chocolate Cake' },
    };
    expect(getVariantDisplayName(customVariant)).toBe('Chocolate Cake - Slice');

    expect(getVariantDisplayName(null)).toBe('');
    expect(getVariantDisplayName(undefined)).toBe('');
  });
});
