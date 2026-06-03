import { betterAuth } from "better-auth";
import { authOptions } from "@repo/auth/server";

export const auth = betterAuth(authOptions as any);
