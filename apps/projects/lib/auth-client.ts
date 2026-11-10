import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { env } from "@repo/env";
import { getResolvedAuthUrl } from "./urls";

export const getAuthUrl = () =>
  getResolvedAuthUrl(
    env.NEXT_PUBLIC_AUTH_URL || (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_AUTH_URL : undefined),
    env.NODE_ENV
  );

export const authClient: any = createAuthClient({
  baseURL: getAuthUrl(),
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
