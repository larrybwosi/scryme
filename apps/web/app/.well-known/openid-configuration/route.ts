import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { auth } from "@repo/auth/server";

export const GET = oauthProviderOpenIdConfigMetadata(auth);
