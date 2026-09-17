import { createAuthClient } from "better-auth/react";

function getValidAuthUrl(url: string | undefined, defaultUrl: string): string {
  if (!url || typeof url !== "string") return defaultUrl;
  if (url.includes("PLACEHOLDER")) return defaultUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return defaultUrl;
  return url;
}

const isDev = process.env.NODE_ENV === "development";
const defaultAdminUrl = isDev
  ? "http://localhost:3007"
  : "https://admin.scryme.tech";

export const authClient = createAuthClient({
  baseURL: getValidAuthUrl(process.env.NEXT_PUBLIC_ADMIN_URL, defaultAdminUrl),
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signOut: typeof authClient.signOut = authClient.signOut;
export const useSession: typeof authClient.useSession = authClient.useSession;
