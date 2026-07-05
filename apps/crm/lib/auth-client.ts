import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const requestPasswordReset: typeof authClient.requestPasswordReset = authClient.requestPasswordReset;
