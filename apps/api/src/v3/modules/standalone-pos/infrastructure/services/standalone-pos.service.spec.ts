import { Test, TestingModule } from "@nestjs/testing";
import { StandalonePosService } from "./standalone-pos.service";
import { PrismaService } from "@/prisma/prisma.service";
import {
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as crypto from "crypto";

describe("StandalonePosService", () => {
  let service: StandalonePosService;

  const mockPrisma = {
    client: {
      standaloneSetupKey: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      standaloneDevice: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      standaloneDeviceKey: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      organization: {
        findUnique: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StandalonePosService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<StandalonePosService>(StandalonePosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createSetupKey", () => {
    it("should create a setup key and return the raw token, saving the hashed token to db", async () => {
      const dto = { name: "Test Device", deviceId: "POS-1" };
      mockPrisma.client.standaloneSetupKey.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          id: "1",
          name: data.name,
          deviceId: data.deviceId,
          token: data.token, // This is hashedToken
        });
      });

      const result = await service.createSetupKey(dto);

      expect(result).toBeDefined();
      // Raw token is 64-char hex string
      expect(result.token).toHaveLength(64);
      // Hashed token in db create call should be SHA-256 hash of raw token
      const expectedHashedToken = crypto.createHash("sha256").update(result.token).digest("hex");
      expect(mockPrisma.client.standaloneSetupKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: expectedHashedToken,
          }),
        }),
      );
    });
  });

  describe("activateDevice", () => {
    it("should throw UnauthorizedException for invalid token", async () => {
      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue(null);
      await expect(
        service.activateDevice({ token: "invalid", machineId: "m1" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw ForbiddenException if token already used", async () => {
      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue({
        usedAt: new Date(),
      });
      await expect(
        service.activateDevice({ token: "token", machineId: "m1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if token expired", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue({
        expiresAt: pastDate,
        usedAt: null,
      });
      await expect(
        service.activateDevice({ token: "token", machineId: "m1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ConflictException if machineId already registered", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue({
        expiresAt: futureDate,
        usedAt: null,
      });
      mockPrisma.client.standaloneDevice.findUnique.mockResolvedValue({
        id: "d1",
      });

      await expect(
        service.activateDevice({ token: "token", machineId: "m1" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should look up and update using hashed token, and return raw key", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const setupKey = {
        id: "s1",
        name: "Test Setup",
        deviceId: "POS-1",
        expiresAt: futureDate,
        usedAt: null,
      };

      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue(setupKey);
      mockPrisma.client.standaloneDevice.findUnique.mockResolvedValue(null);
      mockPrisma.client.standaloneDevice.create.mockResolvedValue({ id: "d1", name: "Test Setup" });
      mockPrisma.client.standaloneDeviceKey.create.mockImplementation(({ data }) => Promise.resolve({
        key: data.key, // hashedKey
        expiresAt: futureDate,
      }));

      const result = await service.activateDevice({ token: "my-token", machineId: "m1" });

      const expectedHashedToken = crypto.createHash("sha256").update("my-token").digest("hex");
      expect(mockPrisma.client.standaloneSetupKey.findUnique).toHaveBeenCalledWith({
        where: { token: expectedHashedToken },
      });

      // Hashed key should be SHA-256 of result.key
      expect(result.key).toHaveLength(32); // 16 bytes rawKey hex is 32 chars
      const expectedHashedKey = crypto.createHash("sha256").update(result.key).digest("hex");
      expect(mockPrisma.client.standaloneDeviceKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            key: expectedHashedKey,
          }),
        }),
      );
    });
  });

  describe("validateKey", () => {
    it("should throw UnauthorizedException for invalid key", async () => {
      mockPrisma.client.standaloneDeviceKey.findUnique.mockResolvedValue(null);
      await expect(service.validateKey("invalid")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should return valid true for active, non-expired key", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      mockPrisma.client.standaloneDeviceKey.findUnique.mockResolvedValue({
        isActive: true,
        expiresAt: futureDate,
        device: { name: "Device" },
      });

      const rawKey = "my-secret-key";
      const expectedHashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

      const result = await service.validateKey(rawKey);
      expect(result.valid).toBe(true);
      expect(mockPrisma.client.standaloneDeviceKey.findUnique).toHaveBeenCalledWith({
        where: { key: expectedHashedKey },
        include: { device: true },
      });
    });
  });
});
