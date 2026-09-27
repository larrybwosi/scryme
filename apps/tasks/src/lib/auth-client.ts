import { createAuthClient } from "better-auth/react";

function getValidApiUrl(): string {
  if (typeof window !== "undefined") {
    const viteApiUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_PUBLIC_API_URL;
    if (viteApiUrl && typeof viteApiUrl === "string" && viteApiUrl.trim() !== "" && !viteApiUrl.includes("PLACEHOLDER")) {
      return viteApiUrl.trim();
    }
  }
  const isDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  return isDev ? "http://localhost:3002" : "https://api.scryme.tech";
}

export const authClient: any = createAuthClient({
  baseURL: getValidApiUrl(),
  fetchOptions: {
    credentials: "include",
  },
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const signOut: typeof authClient.signOut = authClient.signOut;
