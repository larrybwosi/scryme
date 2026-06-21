import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { env } from "@repo/env";
import { ac, ADMIN, CASHIER, DEVELOPER } from "./permissions";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  plugins: [
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

export const { signIn, signUp, useSession, requestPasswordReset } = authClient;
