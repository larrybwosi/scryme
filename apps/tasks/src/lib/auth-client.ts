import { createAuthClient } from "better-auth/react";

const getAuthBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5002";
};

export const authClient: any = createAuthClient({
  baseURL: getAuthBaseUrl(),
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const signOut: typeof authClient.signOut = authClient.signOut;
