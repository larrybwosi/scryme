import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { env } from "@repo/env";

function getValidAuthUrl(
  urls: (string | undefined)[],
  defaultUrl: string,
): string {
  for (const url of urls) {
    if (
      url &&
      typeof url === "string" &&
      !url.includes("PLACEHOLDER") &&
      (url.startsWith("http://") || url.startsWith("https://"))
    ) {
      return url;
    }
  }
  return defaultUrl;
}

const isDev = env.NODE_ENV === "development";
const defaultCentralAuthUrl = isDev
  ? "http://localhost:4444"
  : "https://auth.scryme.tech";

export const authClient: any = createAuthClient({
  baseURL: getValidAuthUrl(
    [env.NEXT_PUBLIC_AUTH_URL],
    defaultCentralAuthUrl,
  ),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [passkeyClient() as any],
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signOut: typeof authClient.signOut = authClient.signOut;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const forgetPassword: typeof authClient.forgetPassword =
  authClient.requestPasswordReset || authClient.forgetPassword;
export const resetPassword: typeof authClient.resetPassword =
  authClient.resetPassword;
