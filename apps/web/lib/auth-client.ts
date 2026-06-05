import { createAuthClient } from "better-auth/react";
import { env } from "@repo/env";

export const authClient = createAuthClient({
    baseURL: env.NEXT_PUBLIC_APP_URL
});

export const { signIn, signUp, useSession, requestPasswordReset } = authClient;
