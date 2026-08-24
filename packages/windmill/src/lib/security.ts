import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * Validates a URL to ensure it is safe for outbound requests (SSRF protection).
 */
export async function isSafeUrl(urlString: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(urlString);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

    const lowerHostname = parsedUrl.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(lowerHostname)) return false;

    const addresses = await lookup(parsedUrl.hostname, { all: true });
    if (!addresses || addresses.length === 0) return false;

    return addresses.every(({ address }) => isSafeIp(address));
  } catch {
    return false;
  }
}

function isSafeIp(ip: string): boolean {
  if (!ip) return false;
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map((o) => parseInt(o, 10));
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a >= 224 && a <= 239) return false;
    return true;
  }
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    if (norm.startsWith("::ffff:")) {
      const ipv4 = ip.split(":").pop();
      return ipv4 ? isSafeIp(ipv4) : false;
    }
    if (["::", "::1", "0:0:0:0:0:0:0:0", "0:0:0:0:0:0:0:1"].includes(norm)) return false;
    if (["fe8", "fe9", "fea", "feb", "fec", "fed", "fee", "fef", "fc", "fd", "ff"].some((p) => norm.startsWith(p))) return false;
    return true;
  }
  return false;
}
