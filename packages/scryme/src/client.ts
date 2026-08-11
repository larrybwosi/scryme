import { ScrymeSDK } from "@scryme/chat";
import { env } from "@repo/env";

export const chat = new ScrymeSDK({
  baseURL: env.SCRYME_CHAT_API_URL,
  clientId: env.SCRYME_CHAT_CLIENT_ID,
  clientSecret: env.SCRYME_CHAT_CLIENT_SECRET,
});
