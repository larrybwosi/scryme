import { getSDK } from "@repo/sdk";
import { env } from "@repo/env";
import { getSession } from "./session";

export async function getPortalSDK() {
  await getSession();
  const sdk = getSDK({
    baseURL: env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v3",
  });

  return sdk;
}
