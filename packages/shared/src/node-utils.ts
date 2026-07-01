import dns from "node:dns";
import { promisify } from "node:util";
import net from "node:net";

const lookup = promisify(dns.lookup);

/**
 * Validates a URL to ensure it is safe for outbound requests.
 * Blocks non-HTTP(S) protocols and requests to internal/private IP ranges (SSRF protection).
 *
 * @param urlString String URL to validate
 * @returns Promise<boolean> True if the URL is safe
 *
 * @security This utility is critical for preventing Server-Side Request Forgery (SSRF)
 * attacks where an attacker might try to make the server request internal resources.
 */
export async function isSafeUrl(urlString: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(urlString);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    const hostname = parsedUrl.hostname;

    // Explicitly block string literal localhosts and similar
    const lowerHostname = hostname.toLowerCase();
    if (
      lowerHostname === "localhost" ||
      lowerHostname === "127.0.0.1" ||
      lowerHostname === "[::1]" ||
      lowerHostname === "0.0.0.0"
    ) {
      return false;
    }

    // Resolve hostname to IP address
    const { address } = await lookup(hostname);

    return isSafeIp(address);
  } catch (error) {
    return false;
  }
}

/**
 * Checks if an IP address is safe (not in a private, loopback, or reserved range).
 */
function isSafeIp(ip: string): boolean {
  if (!ip) return false;

  // --- IPv4 Validation ---
  if (net.isIPv4(ip)) {
    const octets = ip.split(".").map((o) => parseInt(o, 10));

    if (octets.length !== 4 || octets.some(isNaN)) return false;

    // 0.0.0.0/8 (Unspecified)
    if (octets[0] === 0) return false;

    // 10.0.0.0/8 (Private)
    if (octets[0] === 10) return false;

    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return false;

    // 169.254.0.0/16 (Link-local/Metadata)
    if (octets[0] === 169 && octets[1] === 254) return false;

    // 172.16.0.0/12 (Private)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return false;

    // 192.168.0.0/16 (Private)
    if (octets[0] === 192 && octets[1] === 168) return false;

    // 224.0.0.0/4 (Multicast)
    if (octets[0] >= 224 && octets[0] <= 239) return false;

    return true;
  }

  // --- IPv6 Validation ---
  if (net.isIPv6(ip)) {
    const normalizedIp = ip.toLowerCase();

    // Handle IPv4-mapped IPv6 addresses (::ffff:1.2.3.4)
    if (normalizedIp.startsWith("::ffff:")) {
      const ipv4 = ip.split(":").pop();
      return ipv4 ? isSafeIp(ipv4) : false;
    }

    // ::/128 (Unspecified) & ::1/128 (Loopback)
    if (
      normalizedIp === "::" ||
      normalizedIp === "0:0:0:0:0:0:0:0" ||
      normalizedIp === "::1" ||
      normalizedIp === "0:0:0:0:0:0:0:1"
    ) {
      return false;
    }

    // fe80::/10 (Link-local)
    if (
      normalizedIp.startsWith("fe8") ||
      normalizedIp.startsWith("fe9") ||
      normalizedIp.startsWith("fea") ||
      normalizedIp.startsWith("feb")
    ) {
      return false;
    }

    // fc00::/7 (Unique Local Address)
    if (normalizedIp.startsWith("fc") || normalizedIp.startsWith("fd")) {
      return false;
    }

    return true;
  }

  return false;
}