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
} | null>;

export async function getServerAuth(
  permissionOrOptions?: string | { allowNoOrg?: false | undefined; permission?: string }
): Promise<{
  user: SessionUser;
  session: SessionSession;
  organizationId: string;
  memberId: string;
  role: string | undefined;
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
  const organizationId =
    session.session.activeOrganizationId || user.activeOrganizationId;

  const memberId = user.memberId;
  // Ensure organizationId is present before proceeding
  if (!options.allowNoOrg && (!organizationId || !memberId)) {
    redirect("/create-org");
  }

  const role = user.role;

  if (options.permission) {
    if (!role || !hasMemberPermission(role, options.permission)) {
      redirect("/unauthorized");
    }
  }

  return {
    user: session.user,
    session: session.session,
    organizationId: organizationId as any,
    memberId: memberId as any,
    role,
  };
}

export * from "./index";
export { auth };
