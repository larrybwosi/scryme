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

  it("should allow safe public URLs", async () => {
    mockLookup.mockImplementation((hostname: string, cb: any) => {
      cb(null, { address: "93.184.216.34" }); // example.com
    });

    expect(await isSafeUrl("https://example.com/webhook")).toBe(true);
    expect(await isSafeUrl("http://google.com/api")).toBe(true);
  });

  it("should block non-http/https protocols", async () => {
    expect(await isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(await isSafeUrl("ftp://example.com")).toBe(false);
    expect(await isSafeUrl("gopher://example.com")).toBe(false);
  });

  it("should block loopback addresses", async () => {
    mockLookup.mockImplementation((hostname: string, cb: any) => {
      cb(null, { address: "127.0.0.1" });
    });
    expect(await isSafeUrl("http://localhost:3000")).toBe(false);
    expect(await isSafeUrl("http://127.0.0.1:3000")).toBe(false);
    expect(await isSafeUrl("http://127.0.0.2")).toBe(false);

    mockLookup.mockImplementation((hostname: string, cb: any) => {
      cb(null, { address: "::1" });
    });
    expect(await isSafeUrl("http://[::1]")).toBe(false);
  });

  it("should block private IPv4 ranges", async () => {
    const privateIps = [
      "10.0.0.1",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // link-local/metadata
      "0.0.0.0",
    ];

    for (const ip of privateIps) {
      mockLookup.mockImplementation((hostname: string, cb: any) => {
        cb(null, { address: ip });
      });
      expect(await isSafeUrl(`http://some-internal-host.local`)).toBe(false);
      expect(await isSafeUrl(`http://${ip}`)).toBe(false);
    }
  });

  it("should block private IPv6 ranges", async () => {
    const privateIps = ["fc00::1", "fc00::", "fe80::1"];

    for (const ip of privateIps) {
      mockLookup.mockImplementation((hostname: string, cb: any) => {
        cb(null, { address: ip });
      });
      expect(await isSafeUrl(`http://some-internal-host.local`)).toBe(false);
      expect(await isSafeUrl(`http://[${ip}]`)).toBe(false);
    }
  });

  it("should block IPv4-mapped IPv6 addresses for private ranges", async () => {
    const mappedIps = [
      "::ffff:127.0.0.1",
      "::ffff:10.0.0.1",
      "::ffff:169.254.169.254",
    ];

    for (const ip of mappedIps) {
      mockLookup.mockImplementation((hostname: string, cb: any) => {
        cb(null, { address: ip });
      });
      expect(await isSafeUrl(`http://[${ip}]`)).toBe(false);
    }
  });

  it("should block invalid URLs", async () => {
    expect(await isSafeUrl("not-a-url")).toBe(false);
    expect(await isSafeUrl("http://")).toBe(false);
  });

  it("should return false if DNS lookup fails", async () => {
    mockLookup.mockImplementation((hostname: string, cb: any) => {
      cb(new Error("DNS Error"));
    });
    expect(await isSafeUrl("https://non-existent-domain.test")).toBe(false);
  });
});