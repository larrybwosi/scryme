import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host");

  let subdomain = "";
  if (hostname) {
    const parts = hostname.split(".");
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  if (subdomain && subdomain !== "www") {
    return NextResponse.rewrite(
      new URL(`/${subdomain}${url.pathname}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
