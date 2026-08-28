import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@repo/auth/server";

const authRoutes = ["/login"];
const publicRoutes = ["/api/auth", "/health", "/api/health"];
const exemptFromRoleCheck = ["/forbidden"];

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip proxy processing for public routes and auth API
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

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

  // Authenticated but on the login page - send to the dashboard
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Only SUPER_ADMIN accounts may use the platform admin console
  const systemRole = (session.user as any).systemRole || (session.user as any).role;
  if (systemRole !== "SUPER_ADMIN" && !exemptFromRoleCheck.includes(pathname)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
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
      `[ADMIN PROXY] ${request.method} ${pathname} - Status: ${status}${
        location ? ` -> Redirect to: ${location}` : ""
      } (${duration}ms)`,
    );
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[ADMIN PROXY ERROR] ${request.method} ${pathname} - Error:`,
      error,
      `(${duration}ms)`,
    );
    throw error;
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
