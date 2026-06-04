import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "better-auth/types";

const authRoutes = ["/login", "/sign-up"];
const publicRoutes = ["/api/auth"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and auth API
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const { data: session } = await betterFetch<any>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        //get the cookie from the request
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

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
  if (session.user.banned && pathname !== "/banned") {
    return NextResponse.redirect(new URL("/banned", request.url));
  }

  // Check for organization
  const organizationId = (session.session as any).activeOrganizationId || (session.user as any).activeOrganizationId;
  const isExcludedFromOrgCheck = ["/banned", "/forbidden"].includes(pathname);

  if (!organizationId && !isExcludedFromOrgCheck) {
     const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
     return NextResponse.redirect(new URL("/create-org", webUrl));
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
