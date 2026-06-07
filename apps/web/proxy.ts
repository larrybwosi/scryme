// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const authRoutes = ["/login", "/sign-up", "/reset-password"];
const publicRoutes = ["/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public routes and auth API
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
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

  // If authenticated and on an auth route, redirect to dashboard
  if (isAuthRoute) {
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

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
