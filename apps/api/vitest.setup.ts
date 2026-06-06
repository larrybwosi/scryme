import { vi } from 'vitest';

// Set dummy env variables for tests
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || 'test-secret-at-least-32-chars-long-for-security';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/test';
process.env.NODE_ENV = 'test';

// Mock server-only to allow Vitest to run in node environment
vi.mock('server-only', () => ({}));
