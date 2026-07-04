import { isSafeUrl } from "../security";
import dns from "node:dns";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:dns", async () => {
  const actual = await vi.importActual("node:dns") as any;
  return {
    ...actual,
    default: {
      ...actual.default,
      lookup: vi.fn(),
    },
    lookup: vi.fn(),
  };
});

describe("isSafeUrl - multi-IP support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should block hostname if ANY resolved IP is unsafe", async () => {
    const mockLookup = dns.lookup as any;

    // Mock resolving to one safe and one unsafe IP
    mockLookup.mockImplementation((hostname: string, options: any, cb: any) => {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      if (options.all) {
        cb(null, [
          { address: "93.184.216.34", family: 4 }, // example.com (safe)
          { address: "127.0.0.1", family: 4 }      // localhost (unsafe)
        ]);
      } else {
        cb(null, "93.184.216.34", 4);
      }
    });

    const isSafe = await isSafeUrl("http://attacker.com");
    expect(isSafe).toBe(false);
    expect(mockLookup).toHaveBeenCalledWith("attacker.com", { all: true }, expect.any(Function));
  });

  it("should allow hostname if ALL resolved IPs are safe", async () => {
    const mockLookup = dns.lookup as any;

    mockLookup.mockImplementation((hostname: string, options: any, cb: any) => {
      if (options.all) {
        cb(null, [
          { address: "93.184.216.34", family: 4 },
          { address: "1.1.1.1", family: 4 }
        ]);
      } else {
        cb(null, "93.184.216.34", 4);
      }
    });

    const isSafe = await isSafeUrl("http://example.com");
    expect(isSafe).toBe(true);
  });

  it("should block hostname if it resolves to a private IPv4-mapped IPv6 address", async () => {
    const mockLookup = dns.lookup as any;

    mockLookup.mockImplementation((hostname: string, options: any, cb: any) => {
      if (options.all) {
        cb(null, [
          { address: "::ffff:127.0.0.1", family: 6 }
        ]);
      } else {
        cb(null, "::ffff:127.0.0.1", 6);
      }
    });

    const isSafe = await isSafeUrl("http://malicious-v6.com");
    expect(isSafe).toBe(false);
  });
});
