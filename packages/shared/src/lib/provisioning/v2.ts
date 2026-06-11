import * as crypto from "crypto";
import * as argon2 from "argon2";
import { encrypt } from "../../api/v2/utils/encryption";
import { PrismaClient } from "@repo/db";

export async function provisionDeviceV2(
  prisma: PrismaClient,
  token: string,
  extraData: {
    ipAddress?: string;
    serialNumber?: string;
    macAddress?: string;
  } = {},
) {
  const startTime = performance.now();
  console.log("[ProvisionV2] Starting provisioning with token");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  console.log("[ProvisionV2] Looking up setup token");
  const dbStart = performance.now();
  const setupToken = await prisma.deviceSetupToken.findUnique({
    where: { tokenHash },
  });
  console.log(
    `[ProvisionV2] DB Lookup took ${(performance.now() - dbStart).toFixed(2)}ms`,
  );

  if (!setupToken) {
    throw new Error("Invalid setup token");
  }
  if (setupToken.revokedAt) {
    throw new Error("Setup token has been revoked");
  }
  if (setupToken.usedAt) {
    throw new Error("Setup token has already been used");
  }
  if (setupToken.expiresAt < new Date()) {
    throw new Error("Setup token has expired");
  }

  console.log(
    "[ProvisionV2] Found valid setup token for device:",
    setupToken.deviceName,
  );

  // 1. Generate API Key material
  const secret = crypto.randomBytes(32).toString("hex");
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const envSegment = setupToken.environment.toLowerCase();
  const prefix = `dealio_${setupToken.environment === "LIVE" ? "pk" : "sk"}_${envSegment}_${uniqueId}_`;
  const plaintextKey = `${prefix}${secret}`;

  console.log("[ProvisionV2] Hashing secret with argon2...");
  const argonStart = performance.now();
  const hashedSecret = await argon2.hash(secret, {
    type: argon2.argon2id,
    memoryCost: 4096,
    timeCost: 3,
    parallelism: 4,
  });
  console.log(
    `[ProvisionV2] Argon2 hash complete in ${(performance.now() - argonStart).toFixed(2)}ms`,
  );

  console.log("[ProvisionV2] Encrypting hash for storage...");
  const encryptedHash = encrypt(hashedSecret);
  console.log("[ProvisionV2] Encryption complete");

  // 2-4. Atomically create API key, device registry, and mark token used
  console.log("[ProvisionV2] Running provisioning transaction...");
  const txStart = performance.now();

  const { apiKey, deviceRegistry } = await prisma.$transaction(async (tx) => {
    const apiKey = await tx.apiKey.create({
      data: {
        name: `${setupToken.deviceName} Key`,
        organizationId: setupToken.organizationId,
        createdById: setupToken.createdById,
        environment: setupToken.environment,
        keyType: "POS",
        permissions: setupToken.permissions,
        keyPrefix: prefix,
        hashedKey: encryptedHash,
        locationId: setupToken.locationId,
        metadata: {
          deviceName: setupToken.deviceName,
          deviceType: setupToken.deviceType,
          locationId: setupToken.locationId,
        },
      },
    });

    const deviceRegistry = await tx.deviceRegistry.create({
      data: {
        organizationId: setupToken.organizationId,
        apiKeyId: apiKey.id,
        deviceName: setupToken.deviceName,
        deviceType: setupToken.deviceType,
        locationId: setupToken.locationId,
        status: "ACTIVE",
        serialNumber: extraData.serialNumber,
        macAddress: extraData.macAddress,
        lastSeenAt: new Date(),
        lastSeenIp: extraData.ipAddress,
      },
    });

    await tx.deviceSetupToken.update({
      where: { id: setupToken.id },
      data: {
        usedAt: new Date(),
        redeemedApiKeyId: apiKey.id,
      },
    });

    return { apiKey, deviceRegistry };
  });

  console.log(
    `[ProvisionV2] Transaction complete in ${(performance.now() - txStart).toFixed(2)}ms`,
  );
  console.log(
    `[ProvisionV2] Provisioning complete in ${(performance.now() - startTime).toFixed(2)}ms`,
  );

  return {
    apiKey: plaintextKey,
    apiKeyId: apiKey.id,
    deviceRegistryId: deviceRegistry.id,
    device: {
      deviceName: setupToken.deviceName,
      deviceType: setupToken.deviceType,
      locationId: setupToken.locationId,
      permissions: setupToken.permissions,
      environment: setupToken.environment,
    },
    createdAt: new Date(),
  };
}
