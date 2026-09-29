import { createServerSDK } from "@scryme/sdk/server";
import { env } from "@repo/env";
import { getSession } from "./session";

export async function getPortalSDK() {
  await getSession();
  const sdk = createServerSDK({
    baseURL: env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v3",
  });

  return sdk;
}
