import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  customSessionClient,
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins";
import { ac, ADMIN, CASHIER, DEVELOPER } from "./permissions";

function getValidAuthUrl(url: string | undefined, defaultUrl: string): string {
  if (!url || typeof url !== "string") return defaultUrl;
  if (url.includes("PLACEHOLDER")) return defaultUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return defaultUrl;
  return url;
}

const defaultAuthUrl = "https://api.scryme.tech";

export const authClient: any = createAuthClient({
  baseURL: getValidAuthUrl(process.env.BETTER_AUTH_URL, defaultAuthUrl),
  plugins: [
    customSessionClient(),
    adminClient({
      ac,
      roles: {
        ADMIN,
        CASHIER,
        DEVELOPER,
      },
    }),
    usernameClient(),
    organizationClient(),
  ],
});

export const {
  signIn,
  useSession,
  signOut,
  admin,
  changePassword,
  organization,
  resetPassword,
} = authClient;

export const forgetPassword: any = authClient.forgetPassword;
export const requestPasswordReset = forgetPassword;
