import { env } from "@repo/env";

export function getResolvedApiUrl(customUrl?: string, nodeEnv?: string): string {
  const currentEnv = nodeEnv || process.env.NODE_ENV || "development";
  const isDev = currentEnv === "development";
  const defaultApiUrl = isDev ? "http://localhost:3002/api" : "https://api.scryme.tech/api";

  let rawApiUrl =
    customUrl ||
    (typeof process !== "undefined" ? env.NEXT_PUBLIC_API_URL : undefined);

  let apiUrl = defaultApiUrl;
  if (
    rawApiUrl &&
    typeof rawApiUrl === "string" &&
    !rawApiUrl.includes("PLACEHOLDER") &&
    (rawApiUrl.startsWith("http://") || rawApiUrl.startsWith("https://"))
  ) {
    apiUrl = rawApiUrl;
  }

  if (
    !isDev &&
    (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1") || apiUrl.includes("0.0.0.0"))
  ) {
    apiUrl = "https://api.scryme.tech/api";
  }

  try {
    const parsed = new URL(apiUrl);
    if (parsed.hostname.endsWith("scryme.tech") || !isDev) {
      if (parsed.hostname.endsWith("scryme.tech")) {
        parsed.port = "";
      }
    }
    apiUrl = parsed.toString().replace(/\/+$/, "");
    if (!apiUrl.endsWith("/api")) {
      apiUrl = `${apiUrl}/api`;
    }
  } catch (e) {
    console.error("Failed to parse API URL in getResolvedApiUrl:", e);
  }

  return apiUrl;
}

export function getResolvedSocketUrl(customUrl?: string, nodeEnv?: string): string {
  const currentEnv = nodeEnv || process.env.NODE_ENV || "development";
  const isDev = currentEnv === "development";
  const defaultSocketUrl = isDev ? "http://localhost:3002" : "https://api.scryme.tech";

  let rawSocketUrl =
    customUrl ||
    (typeof process !== "undefined"
      ? env.NEXT_PUBLIC_WS_URL ||
        env.NEXT_PUBLIC_SOCKET_URL ||
        env.NEXT_PUBLIC_API_URL
      : undefined);

  let socketUrl = defaultSocketUrl;
  if (
    rawSocketUrl &&
    typeof rawSocketUrl === "string" &&
    !rawSocketUrl.includes("PLACEHOLDER") &&
    (rawSocketUrl.startsWith("http://") ||
      rawSocketUrl.startsWith("https://") ||
      rawSocketUrl.startsWith("ws://") ||
      rawSocketUrl.startsWith("wss://"))
  ) {
    socketUrl = rawSocketUrl;
  }

  if (
    !isDev &&
    (socketUrl.includes("localhost") ||
      socketUrl.includes("127.0.0.1") ||
      socketUrl.includes("0.0.0.0"))
  ) {
    socketUrl = "https://api.scryme.tech";
  }

  try {
    const parsed = new URL(socketUrl);
    if (parsed.hostname.endsWith("scryme.tech")) {
      parsed.port = "";
    }
    socketUrl = parsed.toString().replace(/\/$/, "");
  } catch (e) {
    console.error("Failed to parse Socket URL in getResolvedSocketUrl:", e);
  }

  return socketUrl;
}
