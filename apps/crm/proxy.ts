import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@repo/auth/server";

const authRoutes = ["/login", "/sign-up"];
const publicRoutes = ["/api/auth", "/health", "/api/health"];

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public routes and auth API
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
    const isDev = process.env.NODE_ENV === "development";
    const defaultWebUrl = isDev ? "http://localhost:3000" : "https://app.scryme.tech";
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || defaultWebUrl;
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
      } (${duration}ms)`
    );
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[CRM PROXY ERROR] ${request.method} ${pathname} - Error:`,
      error,
      `(${duration}ms)`
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
