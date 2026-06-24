import { auth } from "./auth";
import { hasMemberPermission } from "./logic/has-member-permission";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized access or insufficient permissions") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

interface GetServerAuthOptions {
  headers?: Headers | Record<string, string | string[] | undefined>;
  permission?: string;
}

// Safely attempts to look up Next.js headers without breaking NestJS compilation/bundling
async function tryGetNextHeaders() {
  try {
    const dynamicImport = new Function('return import("next/headers")');
    const nextHeadersModule = await dynamicImport();
    return await nextHeadersModule.headers();
  } catch {
    return null;
  }
}

export async function getServerAuth(options?: GetServerAuthOptions | string) {
  let headers: any = undefined;
  let permission: string | undefined = undefined;

  // Normalize parameters to support both signatures:
  // 1. getServerAuth("permission_string")
  // 2. getServerAuth({ headers, permission })
  if (typeof options === "string") {
    permission = options;
  } else if (options && typeof options === "object") {
    headers = options.headers;
    permission = options.permission;
  }

  // Framework Auto-Detection: If headers weren't provided manually, try Next.js runtime fallback
  if (!headers) {
    headers = await tryGetNextHeaders();
  }

  // If we're out of Next.js and no headers were supplied manually (e.g. NestJS context mismatch)
  if (!headers) {
    throw new Error(
      "getServerAuth: Request headers could not be resolved automatically. " +
        "If you are using this inside NestJS, you must explicitly pass the request headers.",
    );
  }

  const session = await auth.api.getSession({
    headers: headers,
  });

  if (!session) {
    return null;
  }

  const user = session.user as any;
  const organizationId =
    (session.session as any).activeOrganizationId || user.activeOrganizationId;
  const memberId = user.memberId;
  const role = user.role;

  if (permission) {
    if (!role || !hasMemberPermission(role, permission)) {
      throw new UnauthorizedError();
    }
  }

  return {
    user: session.user,
    session: session.session,
    organizationId,
    memberId,
    role,
  };
}

export * from "./index";
export { auth };
