import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { env } from "@repo/env";
import { ac, ADMIN, CASHIER, DEVELOPER } from "./permissions";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
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
