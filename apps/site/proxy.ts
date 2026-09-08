import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@repo/auth/server";

const authRoutes = ["/login", "/sign-up", "/developer/login", "/developer/register"];
const protectedPrefixes = ["/developer/dashboard"];
const publicRoutes = ["/api/auth", "/health", "/api/health"];

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public API routes and health checks
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Fetch session via incoming request headers
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // If not authenticated and trying to access a protected route, redirect to login
  if (!session) {
    if (isProtectedRoute) {
      const loginUrl = new URL("/login", request.url);
      const targetPath = pathname + request.nextUrl.search;
      loginUrl.searchParams.set("callbackUrl", targetPath);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // If authenticated and visiting an auth route, redirect to callbackUrl or dashboard
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
    return NextResponse.redirect(new URL("/developer/dashboard", request.url));
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
      `[SITE PROXY] ${request.method} ${pathname} - Status: ${status}${
        location ? ` -> Redirect to: ${location}` : ""
      } (${duration}ms)`
    );
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[SITE PROXY ERROR] ${request.method} ${pathname} - Error:`,
      error,
      `(${duration}ms)`
    );
    throw error;
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
