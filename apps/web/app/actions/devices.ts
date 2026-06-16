"use server";

import { db, DeviceRegistry, ApiKey, InventoryLocation } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function getDevices(): Promise<
  (DeviceRegistry & { location: InventoryLocation; apiKey: ApiKey })[]
> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const devices = await db.deviceRegistry.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      location: true,
      apiKey: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return devices;
}

export async function updateDevicePermissions(
  apiKeyId: string,
  permissions: string[],
) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  // Verify the API key belongs to the organization
  const apiKey = await db.apiKey.findUnique({
    where: {
      id: apiKeyId,
      organizationId: auth.organizationId,
    },
  });

  if (!apiKey) throw new Error("API Key not found");

  await db.apiKey.update({
    where: { id: apiKeyId },
    data: { permissions },
  });

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
    include: { apiKey: true },
  });

  if (!device) throw new Error("Device not found");

  await db.$transaction([
    db.apiKey.update({
      where: { id: device.apiKeyId },
      data: { isActive: false, revokedAt: new Date() },
    }),
    db.deviceRegistry.update({
      where: { id: deviceId },
      data: { status: "INACTIVE" },
    }),
  ]);

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
