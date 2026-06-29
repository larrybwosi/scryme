import dns from "node:dns";
import { promisify } from "node:util";

const lookup = promisify(dns.lookup);

/**
 * Checks if a URL is safe from SSRF (Server-Side Request Forgery).
 * It validates the protocol and ensures the hostname doesn't resolve to
 * private, loopback, or reserved IP ranges.
 *
 * @param url String URL to validate
 * @returns Promise<boolean> True if the URL is safe
 */
export async function isSafeUrl(url: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(url);

    // Only allow http and https
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return false;
    }

    const hostname = parsedUrl.hostname;

    // Explicitly block localhost and similar
    const lowerHostname = hostname.toLowerCase();
    if (
      lowerHostname === "localhost" ||
      lowerHostname === "127.0.0.1" ||
      lowerHostname === "[::1]" ||
      lowerHostname === "0.0.0.0"
    ) {
      return false;
    }

    // Resolve hostname to IP
    const { address, family } = await lookup(hostname);

    if (family === 4) {
      return isSafeIPv4(address);
    } else if (family === 6) {
      return isSafeIPv6(address);
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Validates if an IPv4 address is public and safe.
 * Blocks:
 * - Loopback: 127.0.0.0/8
 * - Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 * - Link-local/Metadata: 169.254.0.0/16
 * - Broadcast: 255.255.255.255
 * - Unspecified: 0.0.0.0
 */
function isSafeIPv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => parseInt(part, 10));

  if (parts.length !== 4 || parts.some(isNaN)) return false;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return false;

  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return false;

  // 172.16.0.0/12 (Private)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;

  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return false;

  // 169.254.0.0/16 (Link-local/Metadata)
  if (parts[0] === 169 && parts[1] === 254) return false;

  // 0.0.0.0 (Unspecified)
  if (parts[0] === 0) return false;

  // 224.0.0.0/4 (Multicast)
  if (parts[0] >= 224 && parts[0] <= 239) return false;

  return true;
}

/**
 * Validates if an IPv6 address is public and safe.
 * Blocks:
 * - Loopback: ::1
 * - Unique Local: fc00::/7
 * - Link-local: fe80::/10
 * - Unspecified: ::
 */
function isSafeIPv6(ip: string): boolean {
  const normalizedIp = ip.toLowerCase();

  // Loopback ::1
  if (normalizedIp === "::1" || normalizedIp === "0:0:0:0:0:0:0:1") return false;

  // Unspecified ::
  if (normalizedIp === "::" || normalizedIp === "0:0:0:0:0:0:0:0") return false;

  // Link-local fe80::/10
  if (normalizedIp.startsWith("fe8")) return false;
  if (normalizedIp.startsWith("fe9")) return false;
  if (normalizedIp.startsWith("fea")) return false;
  if (normalizedIp.startsWith("feb")) return false;

  // Unique Local fc00::/7
  if (normalizedIp.startsWith("fc") || normalizedIp.startsWith("fd")) return false;

  return true;
}
