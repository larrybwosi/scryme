import { describe, expect, it } from "vitest";
import { assertSafeBaseUrl, isPrivateAddress } from "../src/url-safety";
import { UnsafeUrlError } from "../src/errors";

describe("base URL safety", () => {
  it("accepts a public https host", () => {
    expect(assertSafeBaseUrl("https://crm.example.com/api").hostname).toBe("crm.example.com");
  });

  it("rejects plain http, credentials and local hosts", () => {
    expect(() => assertSafeBaseUrl("http://crm.example.com")).toThrow(UnsafeUrlError);
    expect(() => assertSafeBaseUrl("https://user:pass@crm.example.com")).toThrow(UnsafeUrlError);
    expect(() => assertSafeBaseUrl("https://localhost/api")).toThrow(UnsafeUrlError);
    expect(() => assertSafeBaseUrl("https://crm.local")).toThrow(UnsafeUrlError);
  });

  it("rejects private, loopback and link local addresses", () => {
    for (const address of ["10.0.0.5", "127.0.0.1", "169.254.169.254", "192.168.1.2", "::1", "fe80::1"]) {
      expect(isPrivateAddress(address)).toBe(true);
      expect(() => assertSafeBaseUrl(`https://${address}`)).toThrow(UnsafeUrlError);
    }
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
  });

  it("checks resolved addresses before the key is sent", async () => {
    const lookup = async () => ["127.0.0.1"];
    await expect(
      import("../src/url-safety").then(({ assertSafeBaseUrlResolved }) =>
        assertSafeBaseUrlResolved("https://crm.example.com", lookup),
      ),
    ).rejects.toThrow(UnsafeUrlError);
  });

  it("accepts a public resolved address", async () => {
    const lookup = async () => ["8.8.8.8"];
    await expect(
      import("../src/url-safety").then(({ assertSafeBaseUrlResolved }) =>
        assertSafeBaseUrlResolved("https://crm.example.com", lookup),
      ),
    ).resolves.toMatchObject({ hostname: "crm.example.com" });
  });
});
