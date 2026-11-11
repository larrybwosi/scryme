import { env } from "@repo/env";

export function getResolvedAuthUrl(customUrl?: string, nodeEnv?: string): string {
  const currentEnv = nodeEnv || process.env.NODE_ENV || "development";
  const isDev = currentEnv === "development";
  const defaultAuthUrl = isDev ? "http://localhost:4444" : "https://auth.scryme.tech";

  let rawAuthUrl =
    customUrl ||
    (typeof process !== "undefined"
      ? env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL
      : undefined);

  let authUrl = defaultAuthUrl;
  if (
    rawAuthUrl &&
    typeof rawAuthUrl === "string" &&
    !rawAuthUrl.includes("PLACEHOLDER") &&
    (rawAuthUrl.startsWith("http://") || rawAuthUrl.startsWith("https://"))
  ) {
    authUrl = rawAuthUrl;
  }

  if (
    !isDev &&
    (authUrl.includes("localhost") ||
      authUrl.includes("127.0.0.1") ||
      authUrl.includes("0.0.0.0"))
  ) {
    authUrl = "https://auth.scryme.tech";
  }

  try {
    const parsed = new URL(authUrl);
    if (parsed.hostname.endsWith("scryme.tech")) {
      parsed.port = "";
    }
    authUrl = parsed.toString().replace(/\/+$/, "");
  } catch (e) {
    console.error("Failed to parse Auth URL in getResolvedAuthUrl:", e);
  }

  return authUrl;
}
