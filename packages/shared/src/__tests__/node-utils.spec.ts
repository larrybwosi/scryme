import { describe, it, expect, vi } from "vitest";
import { isSafeUrl } from "../node-utils";
import dns from "dns";

vi.mock("dns", () => ({
  default: {
    lookup: vi.fn(),
  },
}));

describe("isSafeUrl", () => {
  const mockLookup = dns.lookup as any;

  it("should return true for safe public URLs", async () => {
    mockLookup.mockImplementation((hostname: string, cb: any) => {
      cb(null, { address: "93.184.216.34" }); // example.com
    });

    expect(await isSafeUrl("https://example.com/webhook")).toBe(true);
    expect(await isSafeUrl("http://google.com/api")).toBe(true);
  });

  it("should return false for non-http/https protocols", async () => {
    expect(await isSafeUrl("ftp://example.com")).toBe(false);
    expect(await isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(await isSafeUrl("gopher://example.com")).toBe(false);
  });

  it("should return false for localhost", async () => {
    mockLookup.mockImplementation((hostname: string, cb: any) => {
      cb(null, { address: "127.0.0.1" });
    });
    expect(await isSafeUrl("http://localhost:3000")).toBe(false);
    expect(await isSafeUrl("http://127.0.0.1:3000")).toBe(false);
  });

  it("should return false for private IPv4 ranges", async () => {
    const privateIps = [
      "10.0.0.1",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "0.0.0.0",
    ];

    for (const ip of privateIps) {
      mockLookup.mockImplementation((hostname: string, cb: any) => {
        cb(null, { address: ip });
      });
      expect(await isSafeUrl(`http://some-internal-host.local`)).toBe(false);
    }
  });

  it("should return false for private/loopback IPv6 ranges", async () => {
    const privateIps = [
      "::1",
      "fc00::",
      "fe80::1",
    ];

    for (const ip of privateIps) {
      mockLookup.mockImplementation((hostname: string, cb: any) => {
        cb(null, { address: ip });
      });
      expect(await isSafeUrl(`http://some-internal-host.local`)).toBe(false);
    }
  });

  it("should return false for invalid URLs", async () => {
    expect(await isSafeUrl("not-a-url")).toBe(false);
  });

  it("should return false if DNS lookup fails", async () => {
    mockLookup.mockImplementation((hostname: string, cb: any) => {
      cb(new Error("DNS Error"));
    });
    expect(await isSafeUrl("https://non-existent-domain.test")).toBe(false);
  });
});
