import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

const isDev = process.env.NODE_ENV === "development";
const defaultAppUrl = isDev
  ? "http://localhost:3001"
  : "https://crm.scryme.tech";

export const authClient: any = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_CRM_URL ||
    defaultAppUrl,
  plugins: [passkeyClient()],
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const requestPasswordReset: typeof authClient.requestPasswordReset =
  authClient.requestPasswordReset;
