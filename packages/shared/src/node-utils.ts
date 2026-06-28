import dns from "dns";
import { promisify } from "util";
import { URL } from "url";
import net from "net";

const lookup = promisify(dns.lookup);

/**
 * Validates a URL to ensure it is safe for outbound requests.
 * Blocks non-HTTP(S) protocols and requests to internal/private IP ranges (SSRF protection).
 *
 * @param urlString The URL to validate.
 * @returns A promise that resolves to true if the URL is safe, false otherwise.
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

    // Explicitly block localhost
    if (hostname === "localhost") {
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

  if (net.isIPv4(ip)) {
    const octets = ip.split(".").map((o) => parseInt(o, 10));

    // 0.0.0.0/8
    if (octets[0] === 0) return false;
    // 10.0.0.0/8 (Private)
    if (octets[0] === 10) return false;
    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return false;
    // 169.254.0.0/16 (Link-local)
    if (octets[0] === 169 && octets[1] === 254) return false;
    // 172.16.0.0/12 (Private)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return false;
    // 192.168.0.0/16 (Private)
    if (octets[0] === 192 && octets[1] === 168) return false;

    return true;
  }

  if (net.isIPv6(ip)) {
    const normalizedIp = ip.toLowerCase();
    // ::1/128 (Loopback)
    if (normalizedIp === "::1" || normalizedIp === "0:0:0:0:0:0:0:1")
      return false;
    // fe80::/10 (Link-local)
    if (normalizedIp.startsWith("fe8") ||
        normalizedIp.startsWith("fe9") ||
        normalizedIp.startsWith("fea") ||
        normalizedIp.startsWith("feb"))
      return false;
    // fc00::/7 (Unique Local Address)
    if (normalizedIp.startsWith("fc") || normalizedIp.startsWith("fd"))
      return false;

    return true;
  }

  return false;
}
