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

  // Verify whether keyId belongs to a legacy ApiKey or a V3ApiClient in this organization
  const apiKey = await db.apiKey.findUnique({
    where: {
      id: keyId,
      organizationId: auth.organizationId,
    },
  });

  if (apiKey) {
    await db.apiKey.update({
      where: { id: keyId },
      data: { permissions },
    });
  } else {
    const v3Client = await db.v3ApiClient.findUnique({
      where: {
        id: keyId,
        organizationId: auth.organizationId,
      },
    });

    if (!v3Client) throw new Error("API Key or V3 Client not found");

    await db.v3ApiClient.update({
      where: { id: keyId },
      data: { scopes: permissions },
    });
  }

  revalidatePath("/settings/devices");
}

export async function revokeDevice(deviceId: string) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const device = await db.deviceRegistry.findUnique({
    where: {
      id: deviceId,
      organizationId: auth.organizationId,
    },
    include: { apiKey: true, v3ApiClient: true },
  });

  if (!device) throw new Error("Device not found");

  const actions: any[] = [
    db.deviceRegistry.update({
      where: { id: deviceId },
      data: { status: "INACTIVE" },
    }),
  ];

  if (device.apiKeyId) {
    actions.push(
      db.apiKey.update({
        where: { id: device.apiKeyId },
        data: { isActive: false, revokedAt: new Date() },
      })
    );
  }

  if (device.v3ApiClientId) {
    actions.push(
      db.v3ApiClient.update({
        where: { id: device.v3ApiClientId },
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

  const device = await db.deviceRegistry.findUnique({
    where: {
      id: deviceId,
      organizationId: auth.organizationId,
    },
  });

  if (!device) throw new Error("Device not found");

  await db.deviceRegistry.delete({
    where: { id: deviceId },
  });

  revalidatePath("/settings/devices");
}
