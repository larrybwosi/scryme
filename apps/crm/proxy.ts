import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@repo/auth/server";
import { env } from "@repo/env";
import { getResolvedAuthUrl } from "@repo/shared/utils";

const authRoutes = ["/login", "/sign-up", "/reset-password", "/verify-email"];
const publicRoutes = ["/api/auth", "/health", "/api/health", "/monitoring"];

function getAuthRouteRedirect(authUrl: string, pathname: string, request: NextRequest): URL {
  const targetPath =
    pathname === "/sign-up"
      ? "/sign-up"
      : pathname === "/reset-password"
        ? "/reset-password"
        : pathname === "/verify-email"
          ? "/verify-email"
          : "/sign-in";

  const redirectUrl = new URL(targetPath, authUrl);
  request.nextUrl.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });

  if (!redirectUrl.searchParams.has("callbackURL") && !redirectUrl.searchParams.has("callbackUrl")) {
    const callback =
      request.nextUrl.searchParams.get("callbackUrl") ||
      request.nextUrl.searchParams.get("redirect") ||
      request.nextUrl.searchParams.get("returnTo") ||
      request.url;
    redirectUrl.searchParams.set("callbackURL", callback);
  }

  return redirectUrl;
}

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public routes, Sentry monitoring tunnel, and auth API
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const authUrl = getResolvedAuthUrl(env.NEXT_PUBLIC_AUTH_URL, env.NODE_ENV);
  const isAuthRoute = authRoutes.includes(pathname);

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    if (isAuthRoute) {
      return NextResponse.redirect(getAuthRouteRedirect(authUrl, pathname, request));
    }
    const loginUrl = new URL("/sign-in", authUrl);
    loginUrl.searchParams.set("callbackURL", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and on an auth route, redirect to home or callbackUrl
  if (isAuthRoute) {
    const callbackUrl =
      request.nextUrl.searchParams.get("callbackUrl") ||
      request.nextUrl.searchParams.get("callbackURL") ||
      request.nextUrl.searchParams.get("redirect") ||
      request.nextUrl.searchParams.get("returnTo");

    if (callbackUrl) {
      try {
        if (callbackUrl.startsWith("/")) {
          return NextResponse.redirect(new URL(callbackUrl, request.url));
        } else {
          const parsedUrl = new URL(callbackUrl);
          if (
            parsedUrl.hostname.endsWith("scryme.tech") ||
            parsedUrl.hostname === "localhost"
          ) {
            return NextResponse.redirect(parsedUrl);
          }
        }
      } catch (e) {
        console.error("Invalid callbackUrl in proxy redirect:", e);
      }
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check if user is banned
  if ((session.user as any).banned && pathname !== "/banned") {
    return NextResponse.redirect(new URL("/banned", request.url));
  }

  // Check for organization
  const organizationId =
    (session.session as any).activeOrganizationId ||
    (session.user as any).activeOrganizationId;

  const isExcludedFromOrgCheck = ["/banned", "/forbidden"].includes(pathname);

  if (!organizationId && !isExcludedFromOrgCheck) {
    const isDev = process.env.NODE_ENV === "development";
    const defaultWebUrl = isDev
      ? "http://localhost:3000"
      : "https://app.scryme.tech";
    const webUrl =
      process.env.NEXT_PUBLIC_WEB_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      defaultWebUrl;
    return NextResponse.redirect(new URL("/create-org", webUrl));
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
    console.log(
      `[CRM PROXY] ${request.method} ${pathname} - Status: ${status}${
        location ? ` -> Redirect to: ${location}` : ""
      } (${duration}ms)`,
    );
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[CRM PROXY ERROR] ${request.method} ${pathname} - Error:`,
      error,
      `(${duration}ms)`,
    );
    throw error;
  }
}

export const config = {
  matcher: [
    // Skip Sentry monitoring, Next.js internals, and all static files, unless found in search params
    "/((?!monitoring|_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
