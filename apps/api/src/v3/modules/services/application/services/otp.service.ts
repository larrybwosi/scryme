import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus } from "@repo/db";
import { notificationEngine } from "@repo/notifications";
import { RequestOtpDto, VerifyOtpDto } from "../dto/public-booking.dto";

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  async generateOtp(orgId: string, dto: RequestOtpDto) {
    if (!dto.email && !dto.phoneNumber) {
      throw new BadRequestException("Either email or phone number must be provided");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    const verification = await this.prisma.client.bookingVerificationCode.create({
      data: {
        organizationId: orgId,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        code,
        expiresAt,
      },
    });

    // Send OTP
    try {
        await notificationEngine.notify({
            organizationId: orgId,
            templateName: "BOOKING_OTP",
            data: { code },
            recipients: {
                userIds: [] // Notification engine might need a way to send to raw email/phone
            },
            channels: dto.email ? ["EMAIL"] : ["SMS"]
        });
    } catch (e) {
        console.error("Failed to send OTP", e);
    }

    return { verificationId: verification.id };
  }

  async verifyOtp(orgId: string, dto: VerifyOtpDto) {
    const verification = await this.prisma.client.bookingVerificationCode.findFirst({
      where: {
        organizationId: orgId,
        code: dto.code,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        verifiedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    if (!verification) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    await this.prisma.client.bookingVerificationCode.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    });

    return { verificationId: verification.id };
  }

  async validateVerification(orgId: string, verificationId: string) {
      const verification = await this.prisma.client.bookingVerificationCode.findFirst({
          where: {
              id: verificationId,
              organizationId: orgId,
              verifiedAt: { not: null }
          }
      });
      if (!verification) throw new BadRequestException("Identity not verified");
      return verification;
  }
}
