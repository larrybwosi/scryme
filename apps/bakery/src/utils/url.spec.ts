import { describe, it, expect } from 'vitest';
import { sanitizeApiUrl } from './url';

describe('sanitizeApiUrl', () => {
  it('should strip /api/v3 and trailing slashes', () => {
    expect(sanitizeApiUrl('http://localhost:3002/api/v3')).toBe('http://localhost:3002');
    expect(sanitizeApiUrl('http://localhost:3002/api/v3/')).toBe('http://localhost:3002');
    expect(sanitizeApiUrl('http://localhost:3002/')).toBe('http://localhost:3002');
  });

  it('should return default fallback when empty or null', () => {
    expect(sanitizeApiUrl('')).toBe('https://api.scryme.tech');
    expect(sanitizeApiUrl(null)).toBe('https://api.scryme.tech');
  });
});
