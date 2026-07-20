// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@repo/auth/server";

const authRoutes = ["/login", "/sign-up", "/reset-password"];
const publicRoutes = ["/api/auth", "/health", "/api/health"];

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public routes and auth API
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip proxy processing for invitation routes
  if (pathname.startsWith("/invite")) {
    return NextResponse.next();
  }

  // Natively fetch the session using the direct auth API via incoming request headers
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthRoute = authRoutes.includes(pathname);

  if (!session) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated and on an auth route, redirect to dashboard or callbackUrl
  if (isAuthRoute) {
    const callbackUrl =
      request.nextUrl.searchParams.get("callbackUrl") ||
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
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if user is banned
  if ((session.user as any).banned && pathname !== "/banned") {
    return NextResponse.redirect(new URL("/banned", request.url));
  }

  // Check for organization (except on /create-org and error pages)
  const organizationId =
    (session.session as any).activeOrganizationId ||
    (session.user as any).activeOrganizationId;

  const isExcludedFromOrgCheck = [
    "/create-org",
    "/banned",
    "/forbidden",
    "/unauthorized",
  ].includes(pathname);

  if (!organizationId && !isExcludedFromOrgCheck) {
    return NextResponse.redirect(new URL("/create-org", request.url));
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
      `[WEB PROXY] ${request.method} ${pathname} - Status: ${status}${
        location ? ` -> Redirect to: ${location}` : ""
      } (${duration}ms)`,
    );
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[WEB PROXY ERROR] ${request.method} ${pathname} - Error:`,
      error,
      `(${duration}ms)`,
    );
    throw error;
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
