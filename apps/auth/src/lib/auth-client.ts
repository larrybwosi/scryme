import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { ssoClient } from "@better-auth/sso/client";

const IS_PROD = import.meta.env.MODE === "production" || import.meta.env.PROD;

export const DEFAULT_WEB_URL =
  import.meta.env.VITE_PUBLIC_WEB_URL || (IS_PROD ? "https://app.scryme.tech" : "http://localhost:3000");

const getValidBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const envUrl = import.meta.env.VITE_PUBLIC_API_URL;
  if (
    typeof envUrl === "string" &&
    envUrl.trim() !== "" &&
    !envUrl.includes("PLACEHOLDER") &&
    (envUrl.startsWith("http://") || envUrl.startsWith("https://"))
  ) {
    return envUrl.trim();
  }
  return IS_PROD ? "https://auth.scryme.tech" : "http://localhost:4444";
};

export const authClient = createAuthClient({
  baseURL: getValidBaseUrl(),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    passkeyClient(),
    twoFactorClient(),
    oauthProviderClient(),
    ssoClient(),
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

export const signInWithSSO = (domain: string, callbackURL?: string) => {
  return authClient.signIn.sso({
    domain,
    callbackURL: callbackURL || DEFAULT_WEB_URL,
  });
};
