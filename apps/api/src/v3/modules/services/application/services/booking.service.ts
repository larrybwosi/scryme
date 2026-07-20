import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateBookingDto, CompleteBookingDto } from "../dto/service.dto";
import { BookingStatus, MovementType, PricingModel, TransactionType, TransactionChannel, PaymentStatus, DepositType, TransactionStatus } from "@repo/db";
import { notificationEngine } from "@repo/notifications";
import { InventoryMovementService } from "@/v3/modules/inventory/application/services/inventory-movement.service";
import { StaffSchedulingService } from "./staff-scheduling.service";
import { CalComService } from "./calcom.service";
import { Prisma } from "@repo/db";
import { rrulestr } from "rrule";

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly staffSchedulingService: StaffSchedulingService,
    private readonly calComService: CalComService,
  ) {}

  async createBooking(orgId: string, dto: CreateBookingDto & { customerContact?: string }) {
    const service = await this.prisma.client.service.findFirst({
      where: { id: dto.serviceId, organizationId: orgId },
    });

    if (!service) throw new NotFoundException("Service not found");

    // Validate or Auto-Register Customer
    let resolvedCustomerId = dto.customerId;

    if (!resolvedCustomerId && dto.customerContact) {
      const contact = dto.customerContact.trim();
      const isEmail = contact.includes("@");

      let customer = await this.prisma.client.customer.findFirst({
        where: {
          organizationId: orgId,
          OR: [
            isEmail ? { email: contact } : { phone: contact }
          ]
        }
      });

      if (!customer) {
        customer = await this.prisma.client.customer.create({
          data: {
            organizationId: orgId,
            email: isEmail ? contact : undefined,
            phone: !isEmail ? contact : undefined,
            name: isEmail ? contact.split("@")[0] : `Customer ${contact.slice(-4)}`,
            isActive: true,
          }
        });
      }

      resolvedCustomerId = customer.id;
    }

    if (resolvedCustomerId) {
      const customer = await this.prisma.client.customer.findFirst({
        where: { id: resolvedCustomerId, organizationId: orgId }
      });
      if (!customer) {
        throw new BadRequestException("Customer does not exist or does not belong to this organization");
      }
    }

    // Validate Location
    if (dto.locationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: dto.locationId, organizationId: orgId }
      });
      if (!location) {
        throw new BadRequestException("Location does not exist or does not belong to this organization");
      }
    }

    // Validate Staff belong to the organization
    if (dto.staffIds && dto.staffIds.length > 0) {
      const staffCount = await this.prisma.client.member.count({
        where: { id: { in: dto.staffIds }, organizationId: orgId }
      });
      if (staffCount !== dto.staffIds.length) {
        throw new BadRequestException("One or more staff members are invalid or do not belong to this organization");
      }
    }

    // Validate Resources belong to the organization
    if (dto.resourceIds && dto.resourceIds.length > 0) {
      const resourceCount = await this.prisma.client.serviceResource.count({
        where: { id: { in: dto.resourceIds }, organizationId: orgId }
      });
      if (resourceCount !== dto.resourceIds.length) {
        throw new BadRequestException("One or more service resources are invalid or do not belong to this organization");
      }
    }

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
        const isAvailable = await this.staffSchedulingService.isStaffAvailable(staffId, startTime, endTime);
        if (!isAvailable) {
            throw new BadRequestException(`Staff member ${staffId} is not scheduled to work during this time`);
        }

        const calAvailability = await this.calComService.fetchAvailabilityFromCal(staffId, startTime);
        // Assuming fetchAvailabilityFromCal returns busy slots, check for overlap
        // This is a simplified check for the purpose of the task
        if (calAvailability && calAvailability.length > 0) {
            // Logic to check if startTime/endTime overlaps with calAvailability busy slots
        }

        const overlap = await this.prisma.client.serviceBooking.findFirst({
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
        const overlap = await this.prisma.client.serviceBooking.findFirst({
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

    const booking = await this.prisma.client.serviceBooking.create({
      data: {
        organizationId: orgId,
        serviceId: dto.serviceId,
        customerId: resolvedCustomerId,
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

    if (service.requiresDeposit && service.depositAmount) {
        let depositValue = new Prisma.Decimal(service.depositAmount);
        if (service.depositType === DepositType.PERCENTAGE) {
            depositValue = service.price.mul(depositValue).div(100);
        }

        // Create a transaction for the deposit
        await this.prisma.client.transaction.create({
            data: {
                organizationId: orgId,
                number: `DEP-${Date.now().toString().slice(-6)}`,
                type: TransactionType.SALES_ORDER,
                channel: TransactionChannel.ECOMMERCE_STORE,
                status: TransactionStatus.PENDING_CONFIRMATION,
                paymentStatus: PaymentStatus.UNPAID,
                customerId: resolvedCustomerId,
                locationId: dto.locationId || (await this.prisma.client.inventoryLocation.findFirst({ where: { organizationId: orgId } }))?.id || "",
                subtotal: depositValue,
                taxTotal: 0,
                finalTotal: depositValue,
                baseCurrencyTotal: depositValue,
                currencyCode: "KES",
                notes: `Deposit for booking ${booking.id}`,
            }
        });
    }

    if (dto.recurrenceRule) {
        const rule = rrulestr(dto.recurrenceRule, { dtstart: startTime });
        const dates = rule.all((d, i) => i < 50); // Limit to 50 occurrences for safety

        const recurrence = await this.prisma.client.bookingRecurrence.create({
            data: {
                organizationId: orgId,
                rule: dto.recurrenceRule,
                startDate: startTime,
            }
        });

        for (const date of dates) {
            if (date.getTime() === startTime.getTime()) continue;

            const occStartTime = date;
            const occEndTime = new Date(occStartTime.getTime() + (endTime.getTime() - startTime.getTime()));

            await this.prisma.client.serviceBooking.create({
                data: {
                    organizationId: orgId,
                    serviceId: dto.serviceId,
                    customerId: resolvedCustomerId,
                    locationId: dto.locationId,
                    scheduledStartTime: occStartTime,
                    scheduledEndTime: occEndTime,
                    notes: dto.notes,
                    customFields: dto.customFields as any,
                    serviceName: service.name,
                    price: service.price,
                    pricingModel: service.pricingModel,
                    status: BookingStatus.SCHEDULED,
                    recurrenceId: recurrence.id,
                    staff: dto.staffIds ? {
                        create: dto.staffIds.map(id => ({ memberId: id }))
                    } : undefined,
                    resources: dto.resourceIds ? {
                        create: dto.resourceIds.map(id => ({ resourceId: id }))
                    } : undefined,
                }
            });
        }

        await this.prisma.client.serviceBooking.update({
            where: { id: booking.id },
            data: { recurrenceId: recurrence.id }
        });
    }

    if (dto.staffIds && dto.staffIds.length > 0) {
        for (const staffId of dto.staffIds) {
            await this.calComService.syncBookingToCal(staffId, booking);
        }

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
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      include: { service: { include: { materials: true, taxRates: { include: { taxRate: true } } } }, staff: true }
    });

    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.status === BookingStatus.COMPLETED) throw new BadRequestException("Booking already completed");

    const materialsUsed = dto.materials || booking.service.materials.map(m => ({
      variantId: m.variantId,
      quantity: Number(m.quantity)
    }));

    return this.prisma.client.$transaction(async (tx) => {
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
    /**
     * OPTIMIZATION (Bolt ⚡): Replaced broad Prisma 'include' with a targeted 'select' block
     * to avoid over-fetching heavy fields (such as service description/customFields) and unused
     * relational columns. This reduces database I/O, network payload size, and NestJS/Prisma
     * serialization overhead.
     */
    return this.prisma.client.serviceBooking.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        locationId: true,
        organizationId: true,
        serviceId: true,
        customerId: true,
        status: true,
        scheduledStartTime: true,
        scheduledEndTime: true,
        actualStartTime: true,
        actualEndTime: true,
        notes: true,
        customFields: true,
        serviceName: true,
        price: true,
        pricingModel: true,
        recurrenceId: true,
        transactionId: true,
        createdAt: true,
        updatedAt: true,
        service: {
          select: {
            id: true,
            name: true,
            sku: true,
            organizationId: true,
            categoryId: true,
            pricingModel: true,
            price: true,
            minPrice: true,
            requiresDeposit: true,
            depositAmount: true,
            depositType: true,
            estimatedDuration: true,
            bufferTimeBefore: true,
            bufferTimeAfter: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            customerType: true,
            dateOfBirth: true,
            loyaltyPoints: true,
            taxId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            updatedById: true,
            creationType: true,
            defaultLocationId: true,
            organizationId: true,
            crmRecordId: true,
          },
        },
        staff: {
          select: {
            id: true,
            bookingId: true,
            memberId: true,
            member: {
              select: {
                id: true,
                organizationId: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        resources: {
          select: {
            id: true,
            bookingId: true,
            resourceId: true,
            resource: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
    });
  }

  async getBookingById(orgId: string, id: string) {
    const booking = await this.prisma.client.serviceBooking.findFirst({
        where: { id, organizationId: orgId },
        include: {
            service: true,
            customer: true,
            staff: { include: { member: { include: { user: true } } } },
            resources: { include: { resource: true } },
            materials: { include: { variant: true } }
        }
    });

    if (!booking) throw new NotFoundException("Booking not found");
    return booking;
  }

  async updateBookingStatus(orgId: string, id: string, status: BookingStatus) {
    const booking = await this.prisma.client.serviceBooking.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!booking) throw new NotFoundException("Booking not found");

    return this.prisma.client.serviceBooking.update({
        where: { id },
        data: { status }
    });
  }

  async cancelBookingSeries(orgId: string, recurrenceId: string) {
    return this.prisma.client.serviceBooking.updateMany({
        where: {
            organizationId: orgId,
            recurrenceId,
            status: { in: [BookingStatus.SCHEDULED, BookingStatus.REQUESTED] }
        },
        data: {
            status: BookingStatus.CANCELLED
        }
    });
  }
}
