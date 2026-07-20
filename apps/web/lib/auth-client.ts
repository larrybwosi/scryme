import { createAuthClient } from "better-auth/react";

const isDev = process.env.NODE_ENV === "development";
const defaultAppUrl = isDev
  ? "http://localhost:3000"
  : "https://app.scryme.tech";

export const authClient: any = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    defaultAppUrl,
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const requestPasswordReset: typeof authClient.requestPasswordReset =
  authClient.requestPasswordReset;
