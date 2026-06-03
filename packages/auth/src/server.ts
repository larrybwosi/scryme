// @ts-nocheck
// @ts-nocheck
import { betterAuth } from "better-auth";
import { authOptions } from "./index";
import { headers } from "next/headers";
export const auth = betterAuth(authOptions);
export async function getServerAuth() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return null;
    }
    const organizationId = session.session.activeOrganizationId ||
        session.user.activeOrganizationId;
    return {
        user: session.user,
        session: session.session,
        organizationId,
    };
}
export * from "./index";
