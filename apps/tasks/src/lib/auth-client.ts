import { createAuthClient } from "better-auth/react";

function getValidAuthUrl(): string {
  if (typeof window !== "undefined") {
    const viteAuthUrl = (import.meta as any).env?.VITE_AUTH_URL || (import.meta as any).env?.VITE_APP_URL;
    if (viteAuthUrl && typeof viteAuthUrl === "string" && !viteAuthUrl.includes("PLACEHOLDER")) {
      return viteAuthUrl;
    }
  }
  const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
  return isDev ? "http://localhost:3000" : "https://app.scryme.tech";
}

export const authClient: any = createAuthClient({
  baseURL: getValidAuthUrl(),
  fetchOptions: {
    credentials: "include",
  },
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const signOut: typeof authClient.signOut = authClient.signOut;
