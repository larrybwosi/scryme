import { describe, it, expect } from 'vitest';
import { sanitizeApiUrl } from './url';

describe('sanitizeApiUrl', () => {
  it('should strip /api/v2 or /api/v3 and trailing slashes', () => {
    expect(sanitizeApiUrl('http://localhost:3002')).toBe('http://localhost:3002');
    expect(sanitizeApiUrl('http://localhost:3002/')).toBe('http://localhost:3002');
    expect(sanitizeApiUrl('http://localhost:3002/api/v2')).toBe('http://localhost:3002');
    expect(sanitizeApiUrl('http://localhost:3002/api/v2/')).toBe('http://localhost:3002');
    expect(sanitizeApiUrl('http://localhost:3002/api/v3')).toBe('http://localhost:3002');
    expect(sanitizeApiUrl('http://localhost:3002/api/v3/')).toBe('http://localhost:3002');
  });

  it('should handle empty input', () => {
    expect(sanitizeApiUrl('')).toBe('');
  });

  it('should return empty string for whitespace input', () => {
    expect(sanitizeApiUrl('   ')).toBe('');
  });
});
