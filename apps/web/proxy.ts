import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const authRoutes = ["/login", "/sign-up", "/reset-password"];
const publicRoutes = [
  "/api/auth",
  "/health",
  "/api/health",
  "/monitoring",
  "/invite",
];

// Helper function to safely derive base public URL behind reverse proxies
function getRedirectUrl(path: string, request: NextRequest): URL {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = ""; // clear query params unless explicitly needed

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    url.host = forwardedHost;
    url.protocol = forwardedProto ? `${forwardedProto}:` : "https:";
  }
  return url;
}

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Skip public routes & auth API endpoints
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Optimistic cookie check (Works reliably in proxy/middleware without DB hits)
  const sessionCookie = getSessionCookie(request);
  const isAuthRoute = authRoutes.includes(pathname);

  // Unauthenticated Access Check
  if (!sessionCookie) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(getRedirectUrl("/login", request));
  }

  // Authenticated Access on Auth Routes (e.g. user visits /login while logged in)
  if (isAuthRoute) {
    const callbackUrl =
      request.nextUrl.searchParams.get("callbackUrl") ||
      request.nextUrl.searchParams.get("redirect") ||
      request.nextUrl.searchParams.get("returnTo");

    if (callbackUrl) {
      try {
        if (callbackUrl.startsWith("/")) {
          return NextResponse.redirect(getRedirectUrl(callbackUrl, request));
        }
        const parsedUrl = new URL(callbackUrl);
        if (
          parsedUrl.hostname.endsWith("scryme.tech") ||
          parsedUrl.hostname === "localhost"
        ) {
          return NextResponse.redirect(parsedUrl);
        }
      } catch (e) {
        console.error("[WEB PROXY ERROR] Invalid callbackUrl:", e);
      }
    }

    return NextResponse.redirect(getRedirectUrl("/dashboard", request));
  }

  return NextResponse.next();
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const start = Date.now();
  try {
    const response = await handleProxy(request);
    return response;
  } catch (error) {
    console.error(
      `[WEB PROXY ERROR] ${request.method} ${request.nextUrl.pathname}:`,
      error,
    );
    throw error;
  }
}

export const config = {
  matcher: [
    "/((?!monitoring|_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
