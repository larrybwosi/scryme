import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { twoFactorClient } from "better-auth/client/plugins";

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

const isDev = process.env.NODE_ENV === "development";
const defaultAppUrl = isDev
  ? "http://localhost:3000"
  : "https://app.scryme.tech";

export const authClient: any = createAuthClient({
  baseURL: getValidAuthUrl(
    [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_WEB_URL],
    defaultAppUrl,
  ),
  plugins: [
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        if (typeof window !== "undefined") {
          window.location.href = "/two-factor";
        }
      },
    }),
  ],
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const forgetPassword: typeof authClient.forgetPassword =
  authClient.forgetPassword;
export const resetPassword: typeof authClient.resetPassword =
  authClient.resetPassword;
export const requestPasswordReset = authClient.forgetPassword;
export const twoFactor: typeof authClient.twoFactor = authClient.twoFactor;
