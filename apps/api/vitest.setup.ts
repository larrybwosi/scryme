import { vi } from 'vitest';

// Mock server-only to allow Vitest to run in node environment
vi.mock('server-only', () => ({}));

// Mock jsonwebtoken to avoid resolution issues in tests
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn().mockReturnValue('mock-token'),
  verify: vi.fn().mockReturnValue({ sub: 'mock-user' }),
  decode: vi.fn().mockReturnValue({ sub: 'mock-user' }),
}));
