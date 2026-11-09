import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

const IS_PROD = import.meta.env.MODE === "production" || import.meta.env.PROD;

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

export const customerAuthClient = createAuthClient({
  baseURL: getValidBaseUrl(),
  basePath: "/api/customer-auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    passkeyClient(),
  ],
}) as any;

export interface CustomerPasskeySignInOptions {
  callbackURL: string;
  autoFill?: boolean;
}

export const signInCustomerWithPasskey = (options: CustomerPasskeySignInOptions) => {
  return customerAuthClient.signIn.passkey({
    callbackURL: options.callbackURL,
    ...(options?.autoFill ? { autoFill: options.autoFill } : {}),
  });
};

export const addCustomerPasskey = (options?: { name?: string }) => {
  if (typeof customerAuthClient.passkey?.addPasskey === "function") {
    return customerAuthClient.passkey.addPasskey({ name: options?.name || "Customer Passkey" });
  }
  if (typeof customerAuthClient.addPasskey === "function") {
    return customerAuthClient.addPasskey({ name: options?.name || "Customer Passkey" });
  }
  throw new Error("Passkey registration is not supported on customer client.");
};
