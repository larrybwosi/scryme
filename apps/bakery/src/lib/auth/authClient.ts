import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  customSessionClient,
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins";
import { ac, ADMIN, CASHIER, DEVELOPER } from "./permissions";

export const {
  signIn,
  useSession,
  signOut,
  admin,
  changePassword,
  organization,
  requestPasswordReset,
  resetPassword,
} = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
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
