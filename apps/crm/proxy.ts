import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@repo/auth/server";

const authRoutes = ["/login", "/sign-up"];
const publicRoutes = ["/api/auth", "/monitoring"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public routes, Sentry monitoring tunnel, and auth API
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Next.js 16 Proxy natively supports the Node.js runtime, allowing direct session evaluation
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

  // If authenticated and on an auth route, redirect to home
  if (isAuthRoute) {
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
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/create-org", webUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Sentry monitoring, Next.js internals, and all static files, unless found in search params
    "/((?!monitoring|_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
