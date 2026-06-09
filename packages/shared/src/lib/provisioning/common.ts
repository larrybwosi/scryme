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
  const jti = crypto.randomUUID();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const setupToken = await (prisma.client || prisma).deviceSetupToken.create({
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
  filters?: { includeUsed?: boolean; includeExpired?: boolean; includeRevoked?: boolean }
) {
  const where: any = { organizationId };

  if (!filters?.includeUsed) {
    where.usedAt = null;
  }
  if (!filters?.includeExpired) {
    where.expiresAt = { gt: new Date() };
  }
  if (!filters?.includeRevoked) {
    where.revokedAt = null;
  }

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
  const token = await p.deviceSetupToken.findFirst({
    where: { id: tokenId, organizationId },
  });

  if (!token) {
    throw new Error('Setup token not found');
  }

  return p.deviceSetupToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}

export async function deleteDeviceSetupTokensCore(prisma: any, organizationId: string, tokenIds: string[]) {
  const p = prisma.client || prisma;
  return p.deviceSetupToken.deleteMany({
    where: {
      id: { in: tokenIds },
      organizationId,
    },
  });
}
