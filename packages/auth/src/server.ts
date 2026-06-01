import { betterAuth } from "better-auth";
import { authOptions } from "./index";
import { headers } from "next/headers";

export const auth = betterAuth(authOptions as any);

export async function getServerAuth() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return null;
    }

    const organizationId =
        (session.session as any).activeOrganizationId ||
        (session.user as any).activeOrganizationId;

    return {
        user: session.user,
        session: session.session,
        organizationId,
    };
}

export * from "./index";
