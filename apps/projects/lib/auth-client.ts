import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

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

import { env } from "@repo/env";

const isDev = env.NODE_ENV === "development";
const defaultAppUrl = isDev
  ? "http://localhost:3002"
  : "https://projects.scryme.tech";

export const authClient: any = createAuthClient({
  baseURL: getValidAuthUrl(
    [env.NEXT_PUBLIC_APP_URL, env.NEXT_PUBLIC_PROJECTS_URL],
    defaultAppUrl,
  ),
  plugins: [passkeyClient() as any],
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signOut: typeof authClient.signOut = authClient.signOut;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const forgetPassword: typeof authClient.forgetPassword =
  authClient.requestPasswordReset || authClient.forgetPassword;
export const resetPassword: typeof authClient.resetPassword =
  authClient.resetPassword;
