import { db } from "@repo/db";
import { verifyZitadelJwt } from "@repo/zitadel";
export async function handleZitadelCallback(orgId: string, token: string, domain: string, audience: string) {
  const payload = await verifyZitadelJwt(token, domain, audience);
  const email = payload.email || payload.preferred_username;
  let customer = await db.customer.findUnique({ where: { organizationId_email: { organizationId: orgId, email: email! } } });
  if (!customer) customer = await db.customer.create({ data: { name: payload.name || "User", email, organizationId: orgId } });
  let user = await db.user.findUnique({ where: { email: email! } });
  if (!user) user = await db.user.create({ data: { email: email!, name: payload.name || "User", activeOrganizationId: orgId, customerId: customer.id } as any });
  return { user, customerId: customer.id };
}