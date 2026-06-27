import { vi } from "vitest";

// Mock server-only to allow Vitest to run in node environment
vi.mock("server-only", () => ({}));
