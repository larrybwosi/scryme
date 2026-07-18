import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { ac, ADMIN, CASHIER, DEVELOPER } from "./permissions";

const isDev = process.env.NODE_ENV === "development";
const defaultAppUrl = isDev
  ? "http://localhost:3000"
  : "https://app.scryme.tech";

export const authClient: any = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    defaultAppUrl,
  plugins: [
    oauthProviderClient(),
    adminClient({
      ac,
      roles: {
        ADMIN,
        CASHIER,
        DEVELOPER,
      },
    }),
  ],
});

export const signIn: typeof authClient.signIn = authClient.signIn;
export const signUp: typeof authClient.signUp = authClient.signUp;
export const useSession: typeof authClient.useSession = authClient.useSession;
export const requestPasswordReset: typeof authClient.requestPasswordReset =
  authClient.requestPasswordReset;
