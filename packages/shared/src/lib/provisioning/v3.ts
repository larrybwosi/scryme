import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";

export async function provisionDeviceV3(prisma: any, token: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const setupToken = await (prisma.client || prisma).deviceSetupToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      organization: true,
      location: true,
    },
  });

  if (!setupToken) {
    throw new Error("Invalid or expired setup token");
  }

  const clientId = `pos_${crypto.randomBytes(8).toString("hex")}`;
  const rawSecret = crypto.randomBytes(32).toString("hex");
  const hashedSecret = await bcrypt.hash(rawSecret, 10);

  const client = await (prisma.client || prisma).v3ApiClient.create({
    data: {
      name: setupToken.deviceName,
      clientId,
      clientSecret: hashedSecret,
      organizationId: setupToken.organizationId,
      scopes: setupToken.permissions,
    },
  });

  const device = await (prisma.client || prisma).deviceRegistry.create({
    data: {
      organizationId: setupToken.organizationId,
      v3ApiClientId: client.id,
      deviceName: setupToken.deviceName,
      deviceType: setupToken.deviceType,
      locationId: setupToken.locationId,
      status: "ACTIVE",
    },
  });

  await (prisma.client || prisma).deviceSetupToken.update({
    where: { id: setupToken.id },
    data: { usedAt: new Date(), redeemedApiKeyId: client.id },
  });

  return {
    clientId,
    clientSecret: rawSecret,
    apiKey: `${clientId}.${rawSecret}`,
    deviceRegistryId: device.id,
    organization: setupToken.organization,
    device: {
      id: device.id,
      deviceName: setupToken.deviceName,
      deviceType: setupToken.deviceType,
      locationId: setupToken.locationId,
      permissions: setupToken.permissions,
      environment: setupToken.environment,
      location: setupToken.location,
    },
    createdAt: new Date(),
  };
}
