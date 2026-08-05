import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { hasMemberPermission } from "./logic/has-member-permission";

export interface GetServerAuthOptions {
  permission?: string;
  allowNoOrg?: boolean;
}

export async function getServerAuth(
  permissionOrOptions?: string | GetServerAuthOptions,
) {
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
    organizationId,
    memberId,
    role,
  };
}

export * from "./index";
export { auth };
