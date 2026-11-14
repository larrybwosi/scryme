import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getResolvedAuthUrl } from "@repo/shared/utils";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const defaultCallback = `${proto}://${host}/dashboard`;

  const authUrl = getResolvedAuthUrl(process.env.NEXT_PUBLIC_AUTH_URL, process.env.NODE_ENV);
  const target = new URL("/reset-password", authUrl);

  for (const [key, val] of Object.entries(resolvedSearchParams)) {
    if (typeof val === "string") {
      target.searchParams.set(key, val);
    }
  }

  if (!target.searchParams.has("callbackURL") && !target.searchParams.has("callbackUrl")) {
    target.searchParams.set("callbackURL", defaultCallback);
  }

  redirect(target.toString());
}
