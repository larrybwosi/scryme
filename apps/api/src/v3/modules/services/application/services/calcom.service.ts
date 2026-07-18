import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import axios from "axios";

@Injectable()
export class CalComService {
  private readonly baseUrl = "https://api.cal.com/v1";

  constructor(private readonly prisma: PrismaService) {}

  async syncBookingToCal(memberId: string, booking: any) {
    const member = await this.prisma.client.member.findUnique({
        where: { id: memberId },
        select: { calComApiKey: true }
    });

    if (!member?.calComApiKey) return;

    // Logic to create booking in Cal.com
    // In a real scenario, we'd use the Cal.com API to create an event
    try {
        await axios.post(`${this.baseUrl}/bookings`, {
            title: booking.serviceName,
            start: booking.scheduledStartTime,
            end: booking.scheduledEndTime,
            // ... other fields
        }, {
            headers: {
                'Authorization': `Bearer ${member.calComApiKey}`
            }
        });
    } catch (e) {
        console.error("Failed to sync booking to Cal.com", e);
    }
  }

  async fetchAvailabilityFromCal(memberId: string, date: Date) {
     const member = await this.prisma.client.member.findUnique({
        where: { id: memberId },
        select: { calComApiKey: true, calComId: true }
    });

    if (!member?.calComApiKey || !member?.calComId) return [];

    try {
        const response = await axios.get(`${this.baseUrl}/availability`, {
            params: {
                userId: member.calComId,
                date: date.toISOString().split('T')[0]
            },
            headers: {
                'Authorization': `Bearer ${member.calComApiKey}`
            }
        });
        return response.data;
    } catch (e) {
        console.error("Failed to fetch availability from Cal.com", e);
        return [];
    }
  }
}
