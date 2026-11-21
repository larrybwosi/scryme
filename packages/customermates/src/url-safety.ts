import { UnsafeUrlError } from "./errors";

const PRIVATE_V4_RANGES: Array<[string, string]> = [
  ["0.0.0.0", "0.255.255.255"],
  ["10.0.0.0", "10.255.255.255"],
  ["100.64.0.0", "100.127.255.255"],
  ["127.0.0.0", "127.255.255.255"],
  ["169.254.0.0", "169.254.255.255"],
  ["172.16.0.0", "172.31.255.255"],
  ["192.0.0.0", "192.0.0.255"],
  ["192.168.0.0", "192.168.255.255"],
  ["198.18.0.0", "198.19.255.255"],
  ["224.0.0.0", "255.255.255.255"],
];

function toInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => acc * 256 + Number(part), 0) >>> 0;
}

export function isPrivateAddress(address: string): boolean {
  const value = address.toLowerCase().replace(/^\[|\]$/g, "");

  if (value === "::1" || value === "::" || value === "0:0:0:0:0:0:0:1") return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  if (value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb")) return true;
  if (value.startsWith("::ffff:")) {
    return isPrivateAddress(value.slice("::ffff:".length));
  }
  if (value.includes(":")) return false;

  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return false;
  const numeric = toInt(value);
  return PRIVATE_V4_RANGES.some(([start, end]) => numeric >= toInt(start) && numeric <= toInt(end));
}

export function assertSafeBaseUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafeUrlError("Base URL must be a valid absolute URL");
  }

  if (url.protocol !== "https:") {
    throw new UnsafeUrlError("Base URL must use https");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("Base URL must not contain credentials");
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".home.arpa") ||
    !host.includes(".") && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  ) {
    throw new UnsafeUrlError("Base URL host is not a public host");
  }
  if (isPrivateAddress(host)) {
    throw new UnsafeUrlError("Base URL host resolves to a private address");
  }

  return url;
}

export async function assertSafeBaseUrlResolved(
  input: string,
  lookup: (host: string) => Promise<string[]>,
): Promise<URL> {
  const url = assertSafeBaseUrl(input);
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return url;

  const addresses = await lookup(host);
  if (!addresses.length) {
    throw new UnsafeUrlError("Base URL host could not be resolved");
  }
  if (addresses.some((address) => isPrivateAddress(address))) {
    throw new UnsafeUrlError("Base URL host resolves to a private address");
  }
  return url;
}
