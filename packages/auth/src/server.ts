import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { hasMemberPermission } from "./logic/has-member-permission";
import { runWithTenant, db } from "@repo/db";

export interface GetServerAuthOptions {
  permission?: string;
  allowNoOrg?: boolean;
  targetOrganizationId?: string;
}

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;
type SessionUser = NonNullable<SessionResult>["user"];
type SessionSession = NonNullable<SessionResult>["session"];

export async function getServerAuth(
  options: { allowNoOrg: true; permission?: string; targetOrganizationId?: string }
): Promise<{
  user: SessionUser;
  session: SessionSession;
  organizationId: string | null | undefined;
  memberId: string | undefined;
  role: string | undefined;
  systemRole: string | undefined;
  runWithTenant: <T>(fn: () => Promise<T> | T) => Promise<T> | T;
} | null>;

export async function getServerAuth(
  permissionOrOptions?: string | { allowNoOrg?: false | undefined; permission?: string; targetOrganizationId?: string }
): Promise<{
  user: SessionUser;
  session: SessionSession;
  organizationId: string;
  memberId: string;
  role: string | undefined;
  systemRole: string | undefined;
  runWithTenant: <T>(fn: () => Promise<T> | T) => Promise<T> | T;
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

  let organizationId =
    (session.session as any).activeOrganizationId || (user as any).activeOrganizationId;

  const memberId = (user as any).memberId;
  const role = user.role;
  const systemRole = (user as any).systemRole || user.role;
  const isSuperAdmin = systemRole === "SUPER_ADMIN";
  const orgRole = (user as any).orgRole || (isSuperAdmin ? "OWNER" : role);

  if (options.targetOrganizationId && options.targetOrganizationId !== organizationId) {
    organizationId = options.targetOrganizationId;
  }

  // Ensure organizationId is present before proceeding
  if (!options.allowNoOrg && (!organizationId || (!memberId && !isSuperAdmin))) {
    redirect("/create-org");
  }

  // Verify active member record in target organization if not super admin
  if (organizationId && !isSuperAdmin) {
    const member = await db.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!member || !member.isActive) {
      redirect("/unauthorized");
    }
  }

  // Block access for organizations suspended by a platform administrator
  if (organizationId && (session.session as any).isOrgSuspended && !isSuperAdmin) {
    redirect("/suspended");
  }

  if (options.permission) {
    if (!isSuperAdmin && (!orgRole || !hasMemberPermission(orgRole, options.permission))) {
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
    runWithTenant: <T>(fn: () => Promise<T> | T) =>
      runWithTenant(
        {
          organizationId: organizationId || null,
          isSuperAdmin,
        },
        fn
      ),
  };
}

export * from "./index";
export { auth };
