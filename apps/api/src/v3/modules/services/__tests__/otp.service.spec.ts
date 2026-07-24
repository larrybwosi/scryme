import { Test, TestingModule } from "@nestjs/testing";
import { OtpService } from "../application/services/otp.service";
import { PrismaService } from "../../../../prisma/prisma.service";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";

vi.mock("@repo/notifications", () => ({
  notificationEngine: {
    notify: vi.fn().mockResolvedValue(true),
  },
}));

describe("OtpService", () => {
  let service: OtpService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              bookingVerificationCode: {
                create: vi.fn(),
                findFirst: vi.fn(),
                update: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateOtp", () => {
    it("should generate a secure 6-digit OTP code and create db record", async () => {
      const orgId = "org1";
      const dto = { email: "john@example.com" };

      const mockVerification = { id: "verification-id" };
      vi.spyOn(prisma.client.bookingVerificationCode, "create").mockResolvedValue(mockVerification as any);

      const result = await service.generateOtp(orgId, dto);

      expect(prisma.client.bookingVerificationCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: orgId,
            email: "john@example.com",
            code: expect.stringMatching(/^\d{6}$/),
          }),
        })
      );
      expect(result).toEqual({ verificationId: "verification-id" });
    });

    it("should throw BadRequestException if both email and phone number are missing", async () => {
      const orgId = "org1";
      const dto = {};

      await expect(service.generateOtp(orgId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("verifyOtp", () => {
    it("should verify successfully for valid and unexpired OTP", async () => {
      const orgId = "org1";
      const dto = { code: "123456", email: "john@example.com" };

      const mockVerification = { id: "verification-id", code: "123456" };
      vi.spyOn(prisma.client.bookingVerificationCode, "findFirst").mockResolvedValue(mockVerification as any);
      vi.spyOn(prisma.client.bookingVerificationCode, "update").mockResolvedValue({} as any);

      const result = await service.verifyOtp(orgId, dto);

      expect(prisma.client.bookingVerificationCode.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          code: "123456",
          email: "john@example.com",
          phoneNumber: undefined,
          verifiedAt: null,
          expiresAt: { gte: expect.any(Date) },
        },
      });
      expect(prisma.client.bookingVerificationCode.update).toHaveBeenCalledWith({
        where: { id: "verification-id" },
        data: { verifiedAt: expect.any(Date) },
      });
      expect(result).toEqual({ verificationId: "verification-id" });
    });

    it("should throw BadRequestException for invalid/expired OTP", async () => {
      const orgId = "org1";
      const dto = { code: "123456", email: "john@example.com" };

      vi.spyOn(prisma.client.bookingVerificationCode, "findFirst").mockResolvedValue(null);

      await expect(service.verifyOtp(orgId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("validateVerification", () => {
    it("should return verification if it has been verified", async () => {
      const orgId = "org1";
      const verificationId = "ver-1";

      const mockVerification = { id: "ver-1", verifiedAt: new Date() };
      vi.spyOn(prisma.client.bookingVerificationCode, "findFirst").mockResolvedValue(mockVerification as any);

      const result = await service.validateVerification(orgId, verificationId);

      expect(prisma.client.bookingVerificationCode.findFirst).toHaveBeenCalledWith({
        where: {
          id: verificationId,
          organizationId: orgId,
          verifiedAt: { not: null },
        },
      });
      expect(result).toEqual(mockVerification);
    });

    it("should throw BadRequestException if verification is not verified or found", async () => {
      const orgId = "org1";
      const verificationId = "ver-1";

      vi.spyOn(prisma.client.bookingVerificationCode, "findFirst").mockResolvedValue(null);

      await expect(service.validateVerification(orgId, verificationId)).rejects.toThrow(BadRequestException);
    });
  });
});
