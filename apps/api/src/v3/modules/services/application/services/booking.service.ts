import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateBookingDto, CompleteBookingDto } from "../dto/service.dto";
import { BookingStatus, MovementType, PricingModel, TransactionType, TransactionChannel, PaymentStatus } from "@repo/db";
import { notificationEngine } from "@repo/notifications";
import { InventoryMovementService } from "@/v3/modules/inventory/application/services/inventory-movement.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService,
  ) {}

  async createBooking(orgId: string, dto: CreateBookingDto & { customerContact?: string }) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, organizationId: orgId },
    });

    if (!service) throw new NotFoundException("Service not found");

    const startTime = new Date(dto.scheduledStartTime);
    const duration = service.estimatedDuration || 0;

    const totalStartTime = new Date(startTime.getTime() - service.bufferTimeBefore * 60000);
    const endTime = dto.scheduledEndTime
      ? new Date(dto.scheduledEndTime)
      : (new Date(startTime.getTime() + duration * 60000));
    const totalEndTime = new Date(endTime.getTime() + service.bufferTimeAfter * 60000);

    if (endTime && endTime <= startTime) {
      throw new BadRequestException("End time must be after start time");
    }

    if (dto.staffIds) {
      for (const staffId of dto.staffIds) {
        const overlap = await this.prisma.serviceBooking.findFirst({
          where: {
            staff: { some: { memberId: staffId } },
            status: { in: [BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS] },
            OR: [
              {
                scheduledStartTime: { lt: totalEndTime },
                scheduledEndTime: { gt: totalStartTime },
              }
            ],
          }
        });
        if (overlap) throw new BadRequestException(`Staff member ${staffId} is already booked for this time (including buffers)`);
      }
    }

    if (dto.resourceIds) {
      for (const resourceId of dto.resourceIds) {
        const overlap = await this.prisma.serviceBooking.findFirst({
          where: {
            resources: { some: { resourceId: resourceId } },
            status: { in: [BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS] },
            OR: [
              {
                scheduledStartTime: { lt: totalEndTime },
                scheduledEndTime: { gt: totalStartTime },
              }
            ],
          }
        });
        if (overlap) throw new BadRequestException(`Resource ${resourceId} is already booked for this time (including buffers)`);
      }
    }

    const booking = await this.prisma.serviceBooking.create({
      data: {
        organizationId: orgId,
        serviceId: dto.serviceId,
        customerId: dto.customerId,
        locationId: dto.locationId,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        notes: dto.notes,
        customFields: dto.customFields as any,
        serviceName: service.name,
        price: service.price,
        pricingModel: service.pricingModel,
        status: BookingStatus.SCHEDULED,
        staff: dto.staffIds ? {
          create: dto.staffIds.map(id => ({ memberId: id }))
        } : undefined,
        resources: dto.resourceIds ? {
          create: dto.resourceIds.map(id => ({ resourceId: id }))
        } : undefined,
      },
    });

    if (dto.staffIds && dto.staffIds.length > 0) {
        try {
            await notificationEngine.notify({
                organizationId: orgId,
                templateName: "SERVICE_BOOKING_ASSIGNED",
                data: {
                    bookingId: booking.id,
                    serviceName: service.name,
                    startTime: booking.scheduledStartTime,
                    customerContact: dto.customerContact
                },
                recipients: {
                    memberIds: dto.staffIds
                }
            });
        } catch (e) {
            console.error("Failed to send booking notification", e);
        }
    }

    return booking;
  }

  async completeBooking(orgId: string, bookingId: string, memberId: string, dto: CompleteBookingDto) {
    const booking = await this.prisma.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      include: { service: { include: { materials: true, taxRates: { include: { taxRate: true } } } }, staff: true }
    });

    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.status === BookingStatus.COMPLETED) throw new BadRequestException("Booking already completed");

    const materialsUsed = dto.materials || booking.service.materials.map(m => ({
      variantId: m.variantId,
      quantity: Number(m.quantity)
    }));

    return this.prisma.$transaction(async (tx) => {
      if (booking.locationId) {
        for (const material of materialsUsed) {
            await tx.bookingConsumedMaterial.create({
                data: {
                    bookingId: bookingId,
                    variantId: material.variantId,
                    quantity: material.quantity
                }
            });

            await tx.productVariantStock.update({
                where: {
                    variantId_locationId: {
                        variantId: material.variantId,
                        locationId: booking.locationId!,
                    },
                },
                data: {
                    currentStock: { decrement: material.quantity },
                    availableStock: { decrement: material.quantity },
                },
            });

            await this.inventoryMovementService.recordMovement(tx, {
                organizationId: orgId,
                memberId: memberId,
                variantId: material.variantId,
                quantity: Number(material.quantity),
                fromLocationId: booking.locationId!,
                movementType: MovementType.ADJUSTMENT_OUT,
                referenceId: booking.id,
                referenceType: "ServiceBooking",
                notes: `Consumed for service: ${booking.serviceName}`,
            });
        }
      }

      let finalUnitPrice = new Prisma.Decimal(booking.price);
      const actualStart = dto.actualStartTime ? new Date(dto.actualStartTime) : (booking.actualStartTime || booking.scheduledStartTime);
      const actualEnd = dto.actualEndTime ? new Date(dto.actualEndTime) : new Date();

      if (booking.pricingModel === PricingModel.HOURLY) {
        const durationHours = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60);
        finalUnitPrice = finalUnitPrice.mul(new Prisma.Decimal(durationHours));
      }

      const subtotal = finalUnitPrice;
      let taxTotal = new Prisma.Decimal(0);

      const taxData = booking.service.taxRates.map(tr => {
          const amount = subtotal.mul(tr.taxRate.rate);
          taxTotal = taxTotal.add(amount);
          return {
              taxRateId: tr.taxRateId,
              name: tr.taxRate.name,
              rate: tr.taxRate.rate,
              amount
          };
      });

      const finalTotal = subtotal.add(taxTotal);

      const transaction = await tx.transaction.create({
          data: {
              organizationId: orgId,
              number: `SRV-${Date.now().toString().slice(-6)}`,
              type: TransactionType.SERVICE_BOOKING,
              channel: TransactionChannel.MANUAL_ENTRY,
              status: TransactionStatus.COMPLETED,
              paymentStatus: PaymentStatus.UNPAID,
              customerId: booking.customerId,
              memberId: memberId,
              locationId: booking.locationId || "placeholder",
              subtotal,
              taxTotal,
              finalTotal,
              baseCurrencyTotal: finalTotal,
              currencyCode: "KES",
              serviceItems: {
                  create: [{
                      serviceId: booking.serviceId,
                      bookingId: booking.id,
                      serviceName: booking.serviceName,
                      sku: booking.service.sku,
                      quantity: 1,
                      unitPrice: finalUnitPrice,
                      subtotal,
                      taxAmount: taxTotal,
                      lineTotal: finalTotal
                  }]
              },
              taxes: {
                  create: taxData
              }
          }
      });

      const updatedBooking = await tx.serviceBooking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          actualStartTime: actualStart,
          actualEndTime: actualEnd,
          transactionId: transaction.id,
        }
      });

      if (booking.customerId) {
          try {
              await notificationEngine.notify({
                  organizationId: orgId,
                  templateName: "SERVICE_BOOKING_COMPLETED",
                  data: {
                      bookingId: booking.id,
                      serviceName: booking.serviceName,
                      totalAmount: finalTotal.toString(),
                  },
                  recipients: {
                      userIds: [booking.customerId]
                  }
              });
          } catch (e) {
              console.error("Failed to send completion notification", e);
          }
      }

      return updatedBooking;
    });
  }

  async getBookings(orgId: string) {
    return this.prisma.serviceBooking.findMany({
      where: { organizationId: orgId },
      include: {
        service: true,
        customer: true,
        staff: { include: { member: { include: { user: true } } } },
        resources: { include: { resource: true } }
      }
    });
  }
}
