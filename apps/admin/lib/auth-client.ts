import { createAuthClient } from "better-auth/react";

const isDev = process.env.NODE_ENV === "development";
const defaultAdminUrl = isDev
  ? "http://localhost:3007"
  : "https://admin.scryme.tech";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_URL || defaultAdminUrl,
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signOut: typeof authClient.signOut = authClient.signOut;
export const useSession: typeof authClient.useSession = authClient.useSession;
