import { auth } from "./auth";

export * from "./index";
export { auth };
export type { ExtendedUser, ExtendedSession } from "./auth";
export { oauthProviderOpenIdConfigMetadata, oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
