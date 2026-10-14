import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    deviceRegistry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    apiKey: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    v3ApiClient: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (promises) => Promise.all(promises)),
  },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  getDevices,
  updateDevicePermissions,
  revokeDevice,
  deleteDevice,
} from "../devices";

describe("Device Management Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDevices", () => {
    it("should throw error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(getDevices()).rejects.toThrow("Unauthorized");
      expect(db.deviceRegistry.findMany).not.toHaveBeenCalled();
    });

    it("should fetch devices scoped to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.deviceRegistry.findMany as any).mockResolvedValue([
        { id: "dev-1", deviceName: "POS Terminal 1" },
      ]);

      const result = await getDevices();
      expect(result).toEqual([{ id: "dev-1", deviceName: "POS Terminal 1" }]);
      expect(db.deviceRegistry.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("updateDevicePermissions", () => {
    it("should update legacy ApiKey permissions using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.apiKey.findFirst as any).mockResolvedValue({
        id: "key-1",
        organizationId: "org-1",
      });
      (db.apiKey.updateMany as any).mockResolvedValue({ count: 1 });

      await updateDevicePermissions("key-1", ["pos:read", "pos:write"]);

      expect(db.apiKey.findFirst).toHaveBeenCalledWith({
        where: { id: "key-1", organizationId: "org-1" },
      });
      expect(db.apiKey.updateMany).toHaveBeenCalledWith({
        where: { id: "key-1", organizationId: "org-1" },
        data: { permissions: ["pos:read", "pos:write"] },
      });
      expect(db.v3ApiClient.updateMany).not.toHaveBeenCalled();
    });

    it("should update V3ApiClient permissions using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.apiKey.findFirst as any).mockResolvedValue(null);
      (db.v3ApiClient.findFirst as any).mockResolvedValue({
        id: "v3-client-1",
        organizationId: "org-1",
      });
      (db.v3ApiClient.updateMany as any).mockResolvedValue({ count: 1 });

      await updateDevicePermissions("v3-client-1", ["read", "write"]);

      expect(db.v3ApiClient.findFirst).toHaveBeenCalledWith({
        where: { id: "v3-client-1", organizationId: "org-1" },
      });
      expect(db.v3ApiClient.updateMany).toHaveBeenCalledWith({
        where: { id: "v3-client-1", organizationId: "org-1" },
        data: { scopes: ["read", "write"] },
      });
    });

    it("should throw error if key/client is not found or belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.apiKey.findFirst as any).mockResolvedValue(null);
      (db.v3ApiClient.findFirst as any).mockResolvedValue(null);

      await expect(
        updateDevicePermissions("foreign-key", ["read"])
      ).rejects.toThrow("API Key or V3 Client not found");
    });
  });

  describe("revokeDevice", () => {
    it("should revoke device and associated credentials scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.deviceRegistry.findFirst as any).mockResolvedValue({
        id: "dev-1",
        organizationId: "org-1",
        apiKeyId: "key-1",
        v3ApiClientId: "v3-1",
      });

      await revokeDevice("dev-1");

      expect(db.deviceRegistry.findFirst).toHaveBeenCalledWith({
        where: { id: "dev-1", organizationId: "org-1" },
        include: { apiKey: true, v3ApiClient: true },
      });
      expect(db.deviceRegistry.updateMany).toHaveBeenCalledWith({
        where: { id: "dev-1", organizationId: "org-1" },
        data: { status: "INACTIVE" },
      });
      expect(db.apiKey.updateMany).toHaveBeenCalledWith({
        where: { id: "key-1", organizationId: "org-1" },
        data: { isActive: false, revokedAt: expect.any(Date) },
      });
      expect(db.v3ApiClient.updateMany).toHaveBeenCalledWith({
        where: { id: "v3-1", organizationId: "org-1" },
        data: { isActive: false },
      });
    });

    it("should throw error if device not found or belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.deviceRegistry.findFirst as any).mockResolvedValue(null);

      await expect(revokeDevice("foreign-dev")).rejects.toThrow("Device not found");
    });
  });

  describe("deleteDevice", () => {
    it("should delete device using deleteMany scoped by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.deviceRegistry.findFirst as any).mockResolvedValue({
        id: "dev-1",
        organizationId: "org-1",
      });

      await deleteDevice("dev-1");

      expect(db.deviceRegistry.findFirst).toHaveBeenCalledWith({
        where: { id: "dev-1", organizationId: "org-1" },
      });
      expect(db.deviceRegistry.deleteMany).toHaveBeenCalledWith({
        where: { id: "dev-1", organizationId: "org-1" },
      });
    });

    it("should throw error if device to delete is not found", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.deviceRegistry.findFirst as any).mockResolvedValue(null);

      await expect(deleteDevice("dev-99")).rejects.toThrow("Device not found");
      expect(db.deviceRegistry.deleteMany).not.toHaveBeenCalled();
    });
  });
});
