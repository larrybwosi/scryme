import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@repo/auth/server";
import { env } from "@repo/env";
import { getResolvedAuthUrl } from "@/lib/urls";

const publicRoutes = ["/health", "/api/health", "/_next", "/favicon.ico"];

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public routes and Next.js internals
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow Better Auth internal route handler if called directly
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const authUrl = getResolvedAuthUrl(env.NEXT_PUBLIC_AUTH_URL, env.NODE_ENV);

  if (!session) {
    const loginUrl = new URL("/sign-in", authUrl);
    loginUrl.searchParams.set("callbackURL", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is banned
  if ((session.user as any).banned) {
    return NextResponse.redirect(new URL("/banned", authUrl));
  }

  return NextResponse.next();
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const start = Date.now();

  try {
    const response = await handleProxy(request);
    const duration = Date.now() - start;
    const status = response.status;
    const location = response.headers.get("location");
    if (location) {
      console.log(
        `[PROJECTS PROXY] ${request.method} ${pathname} - Redirect -> ${location} (${duration}ms)`,
      );
    }
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[PROJECTS PROXY ERROR] ${request.method} ${pathname} - Error:`,
      error,
      `(${duration}ms)`,
    );
    throw error;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
