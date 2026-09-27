import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";

export const DEFAULT_WEB_URL =
  import.meta.env.VITE_PUBLIC_WEB_URL || "http://localhost:3000";

const getValidApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_PUBLIC_API_URL;
  if (
    typeof envUrl === "string" &&
    envUrl.trim() !== "" &&
    !envUrl.includes("PLACEHOLDER") &&
    (envUrl.startsWith("http://") || envUrl.startsWith("https://"))
  ) {
    return envUrl.trim();
  }
  return "http://localhost:3002";
};

export const authClient = createAuthClient({
  baseURL: getValidApiUrl(),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    passkeyClient(),
    twoFactorClient(),
    oauthProviderClient(),
  ],
}) as any;

export const requestPasswordReset = (email: string, redirectTo: string) => {
  return authClient.forgetPassword({ email, redirectTo });
};

export const consentOAuth2 = (accept: boolean) => {
  return authClient.oauth2.consent({ accept });
};

export const signInWithPasskey = () => {
  return authClient.signIn.passkey();
};
