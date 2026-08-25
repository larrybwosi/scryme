import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { hasMemberPermission } from "./logic/has-member-permission";

export interface GetServerAuthOptions {
  permission?: string;
  allowNoOrg?: boolean;
}

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;
type SessionUser = NonNullable<SessionResult>["user"];
type SessionSession = NonNullable<SessionResult>["session"];

export async function getServerAuth(
  options: { allowNoOrg: true; permission?: string }
): Promise<{
  user: SessionUser;
  session: SessionSession;
  organizationId: string | null | undefined;
  memberId: string | undefined;
  role: string | undefined;
  systemRole: string | undefined;
} | null>;

export async function getServerAuth(
  permissionOrOptions?: string | { allowNoOrg?: false | undefined; permission?: string }
): Promise<{
  user: SessionUser;
  session: SessionSession;
  organizationId: string;
  memberId: string;
  role: string | undefined;
  systemRole: string | undefined;
} | null>;

export async function getServerAuth(
  permissionOrOptions?: string | GetServerAuthOptions,
): Promise<any> {
  const options: GetServerAuthOptions =
    typeof permissionOrOptions === "string"
      ? { permission: permissionOrOptions }
      : permissionOrOptions || {};

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = session.user;
  const sessionData = session.session as any;
  const userData = user as any;

  const organizationId =
    sessionData.activeOrganizationId || userData.activeOrganizationId;

  const memberId = sessionData.memberId || userData.memberId;
  // Ensure organizationId is present before proceeding
  if (!options.allowNoOrg && (!organizationId || !memberId)) {
    redirect("/create-org");
  }

  // Block access for organizations suspended by a platform administrator
  if (organizationId && session.session.isOrgSuspended) {
    redirect("/suspended");
  }

  const role = user.role;
  const systemRole = (user as any).systemRole || user.role;

  if (options.permission) {
    const isSuperAdmin = systemRole === "SUPER_ADMIN";
    if (!isSuperAdmin && (!role || !hasMemberPermission(role, options.permission))) {
      redirect("/unauthorized");
    }
  }

  return {
    user: session.user,
    session: session.session,
    organizationId: organizationId as any,
    memberId: memberId as any,
    role,
    systemRole,
  };
}

export * from "./index";
export { auth };
