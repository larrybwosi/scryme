import { describe, it, expect, vi } from "vitest";
import { isSafeUrl } from "../node-utils";

describe("isSafeUrl", () => {
  it("should allow safe public URLs", async () => {
    expect(await isSafeUrl("https://google.com")).toBe(true);
    expect(await isSafeUrl("https://github.com")).toBe(true);
  });

  it("should block non-http/https protocols", async () => {
    expect(await isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(await isSafeUrl("ftp://example.com")).toBe(false);
    expect(await isSafeUrl("gopher://example.com")).toBe(false);
  });

  it("should block loopback addresses", async () => {
    expect(await isSafeUrl("http://localhost")).toBe(false);
    expect(await isSafeUrl("http://127.0.0.1")).toBe(false);
    expect(await isSafeUrl("http://[::1]")).toBe(false);
    expect(await isSafeUrl("http://127.0.0.2")).toBe(false); // dns.lookup should resolve
  });

  it("should block private IPv4 ranges", async () => {
    expect(await isSafeUrl("http://10.0.0.1")).toBe(false);
    expect(await isSafeUrl("http://172.16.0.1")).toBe(false);
    expect(await isSafeUrl("http://172.31.255.255")).toBe(false);
    expect(await isSafeUrl("http://192.168.1.1")).toBe(false);
  });

  it("should block link-local and metadata addresses", async () => {
    expect(await isSafeUrl("http://169.254.169.254")).toBe(false);
  });

  it("should block private IPv6 ranges", async () => {
    expect(await isSafeUrl("http://[fc00::1]")).toBe(false);
    expect(await isSafeUrl("http://[fe80::1]")).toBe(false);
  });

  it("should block invalid URLs", async () => {
    expect(await isSafeUrl("not-a-url")).toBe(false);
    expect(await isSafeUrl("http://")).toBe(false);
  });
});
