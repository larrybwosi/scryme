import { betterAuth } from "better-auth";
import { authOptions } from "./index";

export const auth = betterAuth(authOptions);
export type Session = typeof auth.$Infer.Session;
export * from "./index";
