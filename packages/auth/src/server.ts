import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { hasMemberPermission } from "./logic/has-member-permission";

export async function getServerAuth(permission?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
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
