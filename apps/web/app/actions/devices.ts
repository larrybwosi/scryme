"use server";

import { db, DeviceRegistry, ApiKey, InventoryLocation } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function getDevices(): Promise<any[]> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const devices = await db.deviceRegistry.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      location: true,
      apiKey: true,
      v3ApiClient: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return devices;
}

export async function updateDevicePermissions(
  keyId: string,
  permissions: string[],
) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Prevention - Use findFirst and updateMany with organizationId filter
  // because ApiKey and V3ApiClient updates must be strictly bounded to the active organization at database runtime.
  const apiKey = await db.apiKey.findFirst({
    where: {
      id: keyId,
      organizationId: auth.organizationId,
    },
  });

  if (apiKey) {
    await db.apiKey.updateMany({
      where: { id: keyId, organizationId: auth.organizationId },
      data: { permissions },
    });
  } else {
    const v3Client = await db.v3ApiClient.findFirst({
      where: {
        id: keyId,
        organizationId: auth.organizationId,
      },
    });

    if (!v3Client) throw new Error("API Key or V3 Client not found");

    await db.v3ApiClient.updateMany({
      where: { id: keyId, organizationId: auth.organizationId },
      data: { scopes: permissions },
    });
  }

  revalidatePath("/settings/devices");
}

export async function revokeDevice(deviceId: string) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Prevention - Look up device scoped to auth.organizationId.
  const device = await db.deviceRegistry.findFirst({
    where: {
      id: deviceId,
      organizationId: auth.organizationId,
    },
    include: { apiKey: true, v3ApiClient: true },
  });

  if (!device) throw new Error("Device not found");

  // 🛡️ Sentinel: BOLA/IDOR Prevention - Use updateMany with organizationId on all mutations
  // to prevent cross-tenant mutations if relational key IDs are manipulated.
  const actions: any[] = [
    db.deviceRegistry.updateMany({
      where: { id: deviceId, organizationId: auth.organizationId },
      data: { status: "INACTIVE" },
    }),
  ];

  if (device.apiKeyId) {
    actions.push(
      db.apiKey.updateMany({
        where: { id: device.apiKeyId, organizationId: auth.organizationId },
        data: { isActive: false, revokedAt: new Date() },
      })
    );
  }

  if (device.v3ApiClientId) {
    actions.push(
      db.v3ApiClient.updateMany({
        where: { id: device.v3ApiClientId, organizationId: auth.organizationId },
        data: { isActive: false },
      })
    );
  }

  await db.$transaction(actions);

  revalidatePath("/settings/devices");
}

export async function deleteDevice(deviceId: string) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Prevention - Look up device scoped to auth.organizationId.
  const device = await db.deviceRegistry.findFirst({
    where: {
      id: deviceId,
      organizationId: auth.organizationId,
    },
  });

  if (!device) throw new Error("Device not found");

  // 🛡️ Sentinel: BOLA/IDOR Prevention - Use deleteMany scoped by id and organizationId
  // because DeviceRegistry model lacks a composite unique constraint on [id, organizationId].
  await db.deviceRegistry.deleteMany({
    where: { id: deviceId, organizationId: auth.organizationId },
  });

  revalidatePath("/settings/devices");
}
