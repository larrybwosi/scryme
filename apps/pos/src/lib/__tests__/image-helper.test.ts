import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPOSImageUrl } from '../image-helper';

describe('getPOSImageUrl', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).__TAURI_INTERNALS__;
  });

  it('returns empty string when given null, undefined, or empty string', () => {
    expect(getPOSImageUrl(null)).toBe('');
    expect(getPOSImageUrl(undefined)).toBe('');
    expect(getPOSImageUrl('')).toBe('');
    expect(getPOSImageUrl('   ')).toBe('');
  });

  it('returns HTTP and HTTPS URLs as-is', () => {
    const httpUrl = 'http://example.com/image.jpg';
    const httpsUrl = 'https://cdn.scryme.tech/products/shoes.jpg';
    expect(getPOSImageUrl(httpUrl)).toBe(httpUrl);
    expect(getPOSImageUrl(httpsUrl)).toBe(httpsUrl);
  });

  it('returns data and blob URLs as-is', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSU...';
    const blobUrl = 'blob:http://localhost:3000/550e8400-e29b-41d4-a716-446655440000';
    expect(getPOSImageUrl(dataUrl)).toBe(dataUrl);
    expect(getPOSImageUrl(blobUrl)).toBe(blobUrl);
  });

  it('resolves relative API upload paths using the default API endpoint', () => {
    expect(getPOSImageUrl('/uploads/2026/03/product.jpg')).toBe('http://localhost:3002/uploads/2026/03/product.jpg');
    expect(getPOSImageUrl('uploads/item.png')).toBe('http://localhost:3002/uploads/item.png');
    expect(getPOSImageUrl('/storage/photos/sample.webp')).toBe('http://localhost:3002/storage/photos/sample.webp');
  });

  it('resolves relative API paths using stored API endpoint', () => {
    localStorage.setItem(
      'pos-auth-storage-v3',
      JSON.stringify({ state: { apiUrl: 'https://api.scryme.tech' } })
    );

    expect(getPOSImageUrl('/uploads/2026/03/product.jpg')).toBe('https://api.scryme.tech/uploads/2026/03/product.jpg');
  });

  it('converts local disk file paths in Tauri desktop mode', () => {
    (window as any).__TAURI_INTERNALS__ = {};

    const localPath = '/Users/scryme/Library/Application Support/pos/product_images/latte.jpg';
    const result = getPOSImageUrl(localPath);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
