import { describe, it, expect } from 'vitest';
import { sanitizeApiUrl } from './url';

describe('sanitizeApiUrl', () => {
  it('should add /api/v2 if missing', () => {
    expect(sanitizeApiUrl('http://localhost:3002')).toBe('http://localhost:3002/api/v2');
  });

  it('should not add /api/v2 if already present', () => {
    expect(sanitizeApiUrl('http://localhost:3002/api/v2')).toBe('http://localhost:3002/api/v2');
  });

  it('should trim trailing slashes before adding /api/v2', () => {
    expect(sanitizeApiUrl('http://localhost:3002/')).toBe('http://localhost:3002/api/v2');
  });

  it('should trim trailing slashes if /api/v2 is already present', () => {
    expect(sanitizeApiUrl('http://localhost:3002/api/v2/')).toBe('http://localhost:3002/api/v2');
  });

  it('should handle empty input', () => {
    expect(sanitizeApiUrl('')).toBe('');
  });

  it('should return empty string for whitespace input', () => {
    expect(sanitizeApiUrl('   ')).toBe('');
  });
});
