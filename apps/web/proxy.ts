import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@repo/auth/server";

const authRoutes = ["/login", "/sign-up", "/reset-password"];
const publicRoutes = [
  "/api/auth",
  "/health",
  "/api/health",
  "/monitoring",
  "/invite",
];

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public routes, Sentry monitoring tunnel, and auth API
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Extract cookies for diagnostic logging
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieKeys = cookieHeader
    ? cookieHeader
        .split(";")
        .map(c => c.trim().split("=")[0])
        .filter(Boolean)
    : [];

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error(
      `[WEB PROXY ERROR] Exception while retrieving session on ${pathname}:`,
      error,
    );
  }

  const isAuthRoute = authRoutes.includes(pathname);

  // Handle Unauthorized / Missing Session
  if (!session) {
    console.warn(
      `[WEB PROXY UNAUTHORIZED] Path: "${pathname}" | isAuthRoute: ${isAuthRoute} | Cookies Present (${
        cookieKeys.length
      }): [${cookieKeys.join(", ")}]`,
    );

    if (isAuthRoute) {
      return NextResponse.next();
    }

    console.log(
      `[WEB PROXY REDIRECT] Unauthenticated request to protected route "${pathname}". Redirecting to "/login".`,
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log(
    `[WEB PROXY AUTHENTICATED] User: ${
      session.user?.id || session.user?.email || "Unknown"
    } | Path: "${pathname}"`,
  );

  // If authenticated and on an auth route, redirect to dashboard or callbackUrl
  if (isAuthRoute) {
    const callbackUrl =
      request.nextUrl.searchParams.get("callbackUrl") ||
      request.nextUrl.searchParams.get("redirect") ||
      request.nextUrl.searchParams.get("returnTo");

    if (callbackUrl) {
      try {
        if (callbackUrl.startsWith("/")) {
          console.log(
            `[WEB PROXY REDIRECT] Redirecting authenticated user on auth route "${pathname}" to relative callbackUrl: "${callbackUrl}"`,
          );
          return NextResponse.redirect(new URL(callbackUrl, request.url));
        } else {
          const parsedUrl = new URL(callbackUrl);
          if (
            parsedUrl.hostname.endsWith("scryme.tech") ||
            parsedUrl.hostname === "localhost"
          ) {
            console.log(
              `[WEB PROXY REDIRECT] Redirecting authenticated user on auth route "${pathname}" to external callbackUrl: "${parsedUrl.href}"`,
            );
            return NextResponse.redirect(parsedUrl);
          }
        }
      } catch (e) {
        console.error(
          "[WEB PROXY ERROR] Invalid callbackUrl in proxy redirect:",
          e,
        );
      }
    }

    console.log(
      `[WEB PROXY REDIRECT] Redirecting authenticated user from "${pathname}" to default "/dashboard"`,
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if user is banned
  if ((session.user as any)?.banned && pathname !== "/banned") {
    console.warn(
      `[WEB PROXY BANNED] User ${session.user.id} is banned. Redirecting to "/banned"`,
    );
    return NextResponse.redirect(new URL("/banned", request.url));
  }

  // Check for organization (except on /create-org and error pages)
  const organizationId =
    (session.session as any)?.activeOrganizationId ||
    (session.user as any)?.activeOrganizationId;

  const isExcludedFromOrgCheck = [
    "/create-org",
    "/banned",
    "/forbidden",
    "/unauthorized",
  ].includes(pathname);

  if (!organizationId && !isExcludedFromOrgCheck) {
    console.warn(
      `[WEB PROXY NO ORG] User ${session.user?.id} has no active organization ID. Redirecting from "${pathname}" to "/create-org"`,
    );
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
    // Skip Sentry monitoring, Next.js internals, and all static files, unless found in search params
    "/((?!monitoring|_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
