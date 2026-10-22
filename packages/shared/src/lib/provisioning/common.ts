import * as crypto from "crypto";

export async function createDeviceSetupTokenCore(
  prisma: any,
  data: {
    organizationId: string;
    createdById: string;
    deviceName: string;
    deviceType: string;
    locationId: string;
    permissions?: string[];
    allowedIps?: string[];
    environment?: string;
  }
) {
  const p = prisma.client || prisma;

  // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Relational Resource Binding
  // MITIGATION: Explicitly validate locationId belongs to the caller's organizationId before issuing device token.
  if (data.locationId) {
    const location = await p.inventoryLocation.findFirst({
      where: { id: data.locationId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!location) {
      throw new Error("Location not found or belongs to another organization");
    }
  }

  const jti = crypto.randomUUID();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const setupToken = await p.deviceSetupToken.create({
    data: {
      organizationId: data.organizationId,
      createdById: data.createdById,
      deviceName: data.deviceName,
      deviceType: data.deviceType as any,
      locationId: data.locationId,
      permissions: data.permissions || [],
      allowedIps: data.allowedIps || [],
      environment: (data.environment || "LIVE") as any,
      jti,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return { ...setupToken, rawToken };
}

export async function getDeviceSetupTokensCore(
  prisma: any,
  organizationId: string,
  filters?: { includeUsed?: boolean; includeExpired?: boolean }
) {
  const where: any = { organizationId };

  if (!filters?.includeUsed) {
    where.usedAt = null;
  }
  if (!filters?.includeExpired) {
    where.expiresAt = { gt: new Date() };
  }
  where.revokedAt = null;

  const tokens = await (prisma.client || prisma).deviceSetupToken.findMany({
    where,
    include: {
      location: { select: { name: true } },
      createdBy: { select: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tokens.map((t: any) => ({
    tokenId: t.id,
    deviceName: t.deviceName,
    deviceType: t.deviceType,
    locationId: t.locationId,
    locationName: t.location?.name,
    permissions: t.permissions,
    allowedIps: t.allowedIps,
    environment: t.environment,
    expiresAt: t.expiresAt,
    usedAt: t.usedAt,
    revokedAt: t.revokedAt,
    createdAt: t.createdAt,
    createdBy: t.createdBy?.user?.name,
    redeemedApiKeyId: t.redeemedApiKeyId,
    status: t.revokedAt ? 'revoked' : t.usedAt ? 'used' : t.expiresAt < new Date() ? 'expired' : 'pending',
  }));
}

export async function revokeSetupTokenCore(prisma: any, organizationId: string, tokenId: string) {
  const p = prisma.client || prisma;

  // THREAT: BOLA/IDOR Vulnerability - Unscoped Mutation
  // MITIGATION: DeviceSetupToken lacks composite unique index on [id, organizationId].
  // Using updateMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
  const updateResult = await p.deviceSetupToken.updateMany({
    where: { id: tokenId, organizationId },
    data: { revokedAt: new Date() },
  });

  if (updateResult.count === 0) {
    throw new Error('Setup token not found');
  }

  return updateResult;
}
