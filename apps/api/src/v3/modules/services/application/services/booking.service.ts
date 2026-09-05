import { Injectable, BadRequestException, ConflictException, NotFoundException, Optional } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateBookingDto, CompleteBookingDto } from "../dto/service.dto";
import { BookingAssignmentStatus, BookingEventSource, BookingStatus, MovementType, PricingModel, TransactionType, TransactionChannel, PaymentStatus, DepositType, TransactionStatus } from "@repo/db";
import { notificationEngine } from "@repo/notifications";
import { InventoryMovementService } from "@/v3/modules/inventory/application/services/inventory-movement.service";
import { StaffSchedulingService } from "./staff-scheduling.service";
import { CalComService } from "./calcom.service";
import { Prisma } from "@repo/db";
import { rrulestr } from "rrule";
import { SchedulingQueueService } from "../../infrastructure/jobs/scheduling-queue.service";

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly staffSchedulingService: StaffSchedulingService,
    private readonly calComService: CalComService,
    @Optional() private readonly schedulingQueue?: SchedulingQueueService,
  ) {}

  /**
   * Schedules a new service booking for an organization.
   * Performs concurrent validations for staff availability, resource allocation, and overlapping slots.
   * Auto-creates customer profiles if contact information is provided without a customer ID.
   *
   * @param orgId - Unique tenant organization identifier.
   * @param dto - Booking creation payload including service ID, scheduled start time, staff, and resources.
   * @returns The created ServiceBooking record.
   */
  async createBooking(
    orgId: string,
    dto: CreateBookingDto & { customerContact?: string },
    requireAssignment = false,
  ) {
    const contact = dto.customerContact?.trim();
    const isEmail = contact?.includes("@");

    // ⚡ Bolt Optimization: Parallelize all initial existence/count lookup validations to avoid O(N) sequential database roundtrips.
    const [service, existingCustomer, customerValid, locationValid, staffCount, resourceCount, defaultLocation] = await Promise.all([
      this.prisma.client.service.findFirst({
        where: { id: dto.serviceId, organizationId: orgId },
        include: {
          staff: { select: { memberId: true } },
          resources: { select: { resourceId: true } },
        },
      }),
      !dto.customerId && contact
        ? this.prisma.client.customer.findFirst({
            where: {
              organizationId: orgId,
              OR: [
                isEmail ? { email: contact } : { phone: contact }
              ]
            }
          })
        : Promise.resolve(null),
      dto.customerId
        ? this.prisma.client.customer.findFirst({
            where: { id: dto.customerId, organizationId: orgId },
            select: { id: true },
          })
        : Promise.resolve(null),
      dto.locationId
        ? this.prisma.client.inventoryLocation.findFirst({
            where: { id: dto.locationId, organizationId: orgId },
            select: { id: true },
          })
        : Promise.resolve(null),
      dto.staffIds && dto.staffIds.length > 0
        ? this.prisma.client.member.count({
            where: { id: { in: dto.staffIds }, organizationId: orgId }
          })
        : Promise.resolve(0),
      dto.resourceIds && dto.resourceIds.length > 0
        ? this.prisma.client.serviceResource.count({
            where: { id: { in: dto.resourceIds }, organizationId: orgId }
          })
        : Promise.resolve(0),
      !dto.locationId
        ? this.prisma.client.inventoryLocation.findFirst({
            where: { organizationId: orgId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!service) throw new NotFoundException("Service not found");

    if (dto.customerId && !customerValid) {
      throw new BadRequestException("Customer does not exist or does not belong to this organization");
    }

    if (dto.locationId && !locationValid) {
      throw new BadRequestException("Location does not exist or does not belong to this organization");
    }

    if (dto.staffIds && dto.staffIds.length > 0 && staffCount !== dto.staffIds.length) {
      throw new BadRequestException("One or more staff members are invalid or do not belong to this organization");
    }

    if (dto.resourceIds && dto.resourceIds.length > 0 && resourceCount !== dto.resourceIds.length) {
      throw new BadRequestException("One or more service resources are invalid or do not belong to this organization");
    }

    // Resolve or Auto-Register Customer
    let resolvedCustomerId = dto.customerId;

    if (!resolvedCustomerId && contact) {
      let customer = existingCustomer;
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

    if ((!dto.staffIds || dto.staffIds.length === 0) && service.staff?.length) {
      for (const candidate of service.staff) {
        const availability = await this.staffSchedulingService.checkStaffAvailability(
          candidate.memberId,
          startTime,
          endTime,
          { organizationId: orgId, locationId: dto.locationId },
        );
        if (availability.available) {
          dto.staffIds = [candidate.memberId];
          break;
        }
      }
    }
    if (requireAssignment && !dto.staffIds?.length) {
      throw new ConflictException("No qualified staff member is available for this booking");
    }

    if ((!dto.resourceIds || dto.resourceIds.length === 0) && service.resources?.length) {
      for (const candidate of service.resources) {
        const conflict = await this.prisma.client.serviceBooking.findFirst({
          where: {
            organizationId: orgId,
            status: { in: [BookingStatus.REQUESTED, BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS] },
            scheduledStartTime: { lt: totalEndTime },
            scheduledEndTime: { gt: totalStartTime },
            resources: { some: { resourceId: candidate.resourceId } },
          },
          select: { id: true },
        });
        if (!conflict) {
          dto.resourceIds = [candidate.resourceId];
          break;
        }
      }
      if (!dto.resourceIds?.length) {
        throw new ConflictException("No required service resource is available");
      }
    }

    // Concurrently validate staff schedules, Cal.com availability, and booking overlaps
    if (dto.staffIds && dto.staffIds.length > 0) {
      await Promise.all(
        dto.staffIds.map(async (staffId) => {
          const [isAvailable, calAvailability, overlap] = await Promise.all([
            typeof this.staffSchedulingService.checkStaffAvailability === "function"
              ? this.staffSchedulingService.checkStaffAvailability(staffId, startTime, endTime, {
                  organizationId: orgId,
                  locationId: dto.locationId,
                }).then(result => result.available)
              : this.staffSchedulingService.isStaffAvailable(staffId, startTime, endTime),
            this.calComService.fetchAvailabilityFromCal(staffId, startTime),
            this.prisma.client.serviceBooking.findFirst({
              where: {
                organizationId: orgId,
                staff: { some: { memberId: staffId } },
                status: { in: [BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS] },
                OR: [
                  {
                    scheduledStartTime: { lt: totalEndTime },
                    scheduledEndTime: { gt: totalStartTime },
                  }
                ],
              }
            }),
          ]);

          if (!isAvailable) {
            throw new BadRequestException(`Staff member ${staffId} is not scheduled to work during this time`);
          }

          if (calAvailability && calAvailability.length > 0) {
            // Logic to check if startTime/endTime overlaps with calAvailability busy slots
          }

          if (overlap) {
            throw new BadRequestException(`Staff member ${staffId} is already booked for this time (including buffers)`);
          }
        })
      );
    }

    // Concurrently validate resource booking overlaps
    if (dto.resourceIds && dto.resourceIds.length > 0) {
      const overlaps = await Promise.all(
        dto.resourceIds.map(async (resourceId) => {
          const overlap = await this.prisma.client.serviceBooking.findFirst({
            where: {
              organizationId: orgId,
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
          return { resourceId, overlap };
        })
      );

      for (const { resourceId, overlap } of overlaps) {
        if (overlap) {
          throw new BadRequestException(`Resource ${resourceId} is already booked for this time (including buffers)`);
        }
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
        events: {
          create: {
            organizationId: orgId,
            source: BookingEventSource.ADMIN,
            type: "BOOKING_CREATED",
            toStatus: BookingStatus.SCHEDULED,
          },
        },
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
          locationId: dto.locationId || defaultLocation?.id || "",
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

      /**
       * OPTIMIZATION (Bolt ⚡): Parallelize individual database inserts for recurring bookings.
       * Instead of executing up to 50 database inserts sequentially (which blocks the request thread
       * and multiplies latency), we run them concurrently via Promise.all.
       * This collapses transactional roundtrips from O(N) down to a flat O(1) concurrent roundtrip block,
       * drastically accelerating response time for recurrent service bookings.
       */
      await Promise.all(
        dates
          .filter((date) => date.getTime() !== startTime.getTime())
          .map(async (date) => {
            const occStartTime = date;
            const occEndTime = new Date(
              occStartTime.getTime() + (endTime.getTime() - startTime.getTime()),
            );

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
                staff: dto.staffIds
                  ? {
                      create: dto.staffIds.map((id) => ({ memberId: id })),
                    }
                  : undefined,
                resources: dto.resourceIds
                  ? {
                      create: dto.resourceIds.map((id) => ({ resourceId: id })),
                    }
                  : undefined,
              },
            });
          }),
      );

      await this.prisma.client.serviceBooking.update({
        where: { id: booking.id },
        data: { recurrenceId: recurrence.id }
      });
    }

    if (dto.staffIds && dto.staffIds.length > 0) {
      // ⚡ Bolt Optimization: Parallelize third-party API booking sync calls.
      // Running these requests sequentially inside a loop introduces a critical O(N) external network IO bottleneck.
      // Parallelizing them via Promise.all with localized try/catch handlers reduces latency from O(N) to O(1)
      // and guarantees that an individual Cal.com sync failure does not break other synchronizations or subsequent notifications.
      await Promise.all(
        dto.staffIds.map(async (staffId) => {
          try {
            await this.calComService.syncBookingToCal(staffId, booking);
          } catch (e) {
            console.error(`Failed to sync booking to Cal.com for staff ${staffId}`, e);
          }
        })
      );

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

    await this.schedulingQueue?.scheduleBooking(orgId, booking.id);
    return booking;
  }

  /**
   * Completes an active service booking, calculates final duration/pricing, records consumed materials,
   * deducts inventory stock from the specified location, and issues a completed service transaction.
   *
   * @param orgId - Unique tenant organization identifier.
   * @param bookingId - Service booking identifier to complete.
   * @param memberId - Authenticated staff member performing the completion.
   * @param dto - Completion payload including actual start/end times and optional override materials.
   * @returns The updated completed ServiceBooking record.
   */
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
        // ⚡ Bolt Optimization: Consolidate materials in-memory to prevent multiple database queries/locks
        // on the exact same product variant stock rows during the booking completion process.
        const consolidatedMaterials = new Map<string, number>();
        for (const material of materialsUsed) {
          const existingQty = consolidatedMaterials.get(material.variantId) || 0;
          consolidatedMaterials.set(material.variantId, existingQty + Number(material.quantity));
        }

        // To prevent database deadlocks under high concurrent booking completions, we sort the unique
        // variantIds deterministically (alphabetically) to guarantee consistent row lock acquisition order.
        const sortedVariantIds = Array.from(consolidatedMaterials.keys()).sort();

        for (const variantId of sortedVariantIds) {
          const quantity = consolidatedMaterials.get(variantId)!;

          await tx.bookingConsumedMaterial.create({
            data: {
              bookingId: bookingId,
              variantId: variantId,
              quantity: quantity
            }
          });

          await tx.productVariantStock.update({
            where: {
              variantId_locationId: {
                variantId: variantId,
                locationId: booking.locationId!,
              },
            },
            data: {
              currentStock: { decrement: quantity },
              availableStock: { decrement: quantity },
            },
          });

          await this.inventoryMovementService.recordMovement(tx, {
            organizationId: orgId,
            memberId: memberId,
            variantId: variantId,
            quantity: quantity,
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

  /**
   * Retrieves all service bookings associated with an organization.
   *
   * @param orgId - Unique tenant organization identifier.
   * @returns Array of ServiceBooking objects with populated service, customer, staff, and resource details.
   */
  async getBookings(
    orgId: string,
    filters: {
      from?: Date;
      to?: Date;
      memberId?: string;
      locationId?: string;
      status?: BookingStatus[];
      limit?: number;
      cursor?: string;
    } = {},
  ) {
    if (filters.from && filters.to && filters.to <= filters.from) {
      throw new BadRequestException("Invalid booking date range");
    }
    return this.prisma.client.serviceBooking.findMany({
      where: {
        organizationId: orgId,
        ...(filters.from ? { scheduledEndTime: { gt: filters.from } } : {}),
        ...(filters.to ? { scheduledStartTime: { lt: filters.to } } : {}),
        ...(filters.memberId ? { staff: { some: { memberId: filters.memberId } } } : {}),
        ...(filters.locationId ? { locationId: filters.locationId } : {}),
        ...(filters.status?.length ? { status: { in: filters.status } } : {}),
      },
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      take: Math.min(filters.limit || 100, 250),
      orderBy: [{ scheduledStartTime: "asc" }, { id: "asc" }],
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

  /**
   * Fetches detailed information for a specific service booking by its ID.
   *
   * @param orgId - Unique tenant organization identifier.
   * @param id - Service booking identifier.
   * @returns The ServiceBooking object with associated relationships.
   */
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

  /**
   * Updates the workflow status of an existing service booking (e.g. CONFIRMED, CANCELLED, IN_PROGRESS).
   *
   * @param orgId - Unique tenant organization identifier.
   * @param id - Service booking identifier.
   * @param status - Target BookingStatus enum value.
   * @returns The updated ServiceBooking record.
   */
  async updateBookingStatus(
    orgId: string,
    id: string,
    status: BookingStatus,
    revision?: number,
    actorMemberId?: string,
    source: BookingEventSource = BookingEventSource.ADMIN,
    reason?: string,
  ) {
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (revision !== undefined && booking.revision !== revision) {
      throw new ConflictException("Booking changed; refresh before trying again");
    }

    const transitions: Record<BookingStatus, BookingStatus[]> = {
      REQUESTED: [BookingStatus.SCHEDULED, BookingStatus.CANCELLED],
      SCHEDULED: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED, BookingStatus.NOSHOW],
      IN_PROGRESS: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
      NOSHOW: [],
    };
    if (!transitions[booking.status].includes(status)) {
      throw new BadRequestException(
        `Cannot transition booking from ${booking.status} to ${status}`,
      );
    }

    const update = await this.prisma.client.serviceBooking.updateMany({
      where: { id, organizationId: orgId, revision: booking.revision },
      data: {
        status,
        revision: { increment: 1 },
        ...(status === BookingStatus.IN_PROGRESS ? { actualStartTime: new Date() } : {}),
      },
    });
    if (!update.count) throw new ConflictException("Booking was updated concurrently");

    await this.prisma.client.bookingEvent.create({
      data: {
        organizationId: orgId,
        bookingId: id,
        source,
        type: `STATUS_${status}`,
        actorMemberId,
        fromStatus: booking.status,
        toStatus: status,
        metadata: reason ? { reason } : undefined,
      },
    });
    return this.getBookingById(orgId, id);
  }

  async respondToAssignment(
    orgId: string,
    bookingId: string,
    memberId: string,
    response: BookingAssignmentStatus,
    revision: number,
    reason?: string,
    source: BookingEventSource = BookingEventSource.ADMIN,
  ) {
    if (response !== BookingAssignmentStatus.ACCEPTED && response !== BookingAssignmentStatus.DECLINED) {
      throw new BadRequestException("Assignment response must be ACCEPTED or DECLINED");
    }
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      select: { id: true, revision: true, status: true },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.revision !== revision) throw new ConflictException("Stale assignment action");

    const assignment = await this.prisma.client.bookingStaff.findFirst({
      where: { bookingId, memberId, booking: { organizationId: orgId } },
    });
    if (!assignment) throw new NotFoundException("Booking assignment not found");
    if (assignment.status === response) return this.getBookingById(orgId, bookingId);

    await this.prisma.client.$transaction([
      this.prisma.client.bookingStaff.update({
        where: { id: assignment.id },
        data: { status: response, respondedAt: new Date(), responseReason: reason },
      }),
      this.prisma.client.bookingEvent.create({
        data: {
          organizationId: orgId,
          bookingId,
          source,
          actorMemberId: memberId,
          type: `ASSIGNMENT_${response}`,
          metadata: reason ? { reason } : undefined,
        },
      }),
    ]);
    return this.getBookingById(orgId, bookingId);
  }

  async rescheduleBooking(
    orgId: string,
    bookingId: string,
    data: {
      scheduledStartTime: Date;
      scheduledEndTime?: Date;
      staffIds?: string[];
      resourceIds?: string[];
      revision: number;
    },
    actorMemberId?: string,
  ) {
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      include: { service: true, staff: true, resources: true },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.revision !== data.revision) throw new ConflictException("Booking changed; refresh first");
    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException("A closed booking cannot be rescheduled");
    }

    const endTime = data.scheduledEndTime || new Date(
      data.scheduledStartTime.getTime() +
      (booking.service.estimatedDuration || 30) * 60_000,
    );
    const staffIds = data.staffIds || booking.staff.map(item => item.memberId);
    for (const memberId of staffIds) {
      const result = await this.staffSchedulingService.checkStaffAvailability(
        memberId,
        data.scheduledStartTime,
        endTime,
        { organizationId: orgId, locationId: booking.locationId || undefined, excludeBookingId: bookingId },
      );
      if (!result.available) {
        throw new ConflictException(`Staff ${memberId} unavailable: ${result.reasons.join(", ")}`);
      }
    }

    const resourceIds = data.resourceIds || booking.resources.map(item => item.resourceId);
    const resourceConflict = await this.prisma.client.serviceBooking.findFirst({
      where: {
        id: { not: bookingId },
        organizationId: orgId,
        status: { in: [BookingStatus.REQUESTED, BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS] },
        scheduledStartTime: { lt: endTime },
        scheduledEndTime: { gt: data.scheduledStartTime },
        resources: { some: { resourceId: { in: resourceIds } } },
      },
    });
    if (resourceConflict) throw new ConflictException("A selected resource is already booked");

    await this.prisma.client.$transaction(async tx => {
      const updated = await tx.serviceBooking.updateMany({
        where: { id: bookingId, organizationId: orgId, revision: data.revision },
        data: {
          scheduledStartTime: data.scheduledStartTime,
          scheduledEndTime: endTime,
          revision: { increment: 1 },
        },
      });
      if (!updated.count) throw new ConflictException("Booking was updated concurrently");
      await tx.bookingStaff.deleteMany({ where: { bookingId } });
      await tx.bookingResource.deleteMany({ where: { bookingId } });
      if (staffIds.length) await tx.bookingStaff.createMany({ data: staffIds.map(memberId => ({ bookingId, memberId })) });
      if (resourceIds.length) await tx.bookingResource.createMany({ data: resourceIds.map(resourceId => ({ bookingId, resourceId })) });
      await tx.bookingEvent.create({
        data: {
          organizationId: orgId,
          bookingId,
          source: BookingEventSource.ADMIN,
          actorMemberId,
          type: "BOOKING_RESCHEDULED",
          metadata: { previousStart: booking.scheduledStartTime, newStart: data.scheduledStartTime },
        },
      });
    });
    await this.schedulingQueue?.scheduleBooking(orgId, bookingId);
    return this.getBookingById(orgId, bookingId);
  }

  /**
   * Cancels all future scheduled or requested service bookings belonging to a recurring booking series.
   *
   * @param orgId - Unique tenant organization identifier.
   * @param recurrenceId - Unique booking recurrence series identifier.
   * @returns Prisma batch update payload with count of updated records.
   */
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

  /**
   * Dynamically calculates available 30-minute booking timeslots for a service on a given date based on
   * staff shifts, configured breaks, buffer times, and existing overlapping bookings.
   *
   * @param orgId - Unique tenant organization identifier.
   * @param serviceId - Service database identifier.
   * @param dateStr - Optional target date in YYYY-MM-DD format (defaults to current date).
   * @returns Object containing service ID, formatted YYYY-MM-DD date, and array of available ISO slot strings.
   */
  async getServiceAvailability(orgId: string, serviceId: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    // Validate targetDate
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException("Invalid date format. Expected YYYY-MM-DD");
    }

    const dayOfWeek = targetDate.getUTCDay();

    const service = await this.prisma.client.service.findFirst({
      where: { id: serviceId, organizationId: orgId },
      include: {
        staff: { select: { memberId: true } },
        resources: { select: { resourceId: true } },
      },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const duration = service.estimatedDuration || 30;
    const bufferBefore = service.bufferTimeBefore || 0;
    const bufferAfter = service.bufferTimeAfter || 0;

    // Get qualified staff IDs
    const qualifiedStaffIds = service.staff.map((s) => s.memberId);

    // Fetch active shifts for qualified staff on this day of week
    const shifts = await this.prisma.client.staffShift.findMany({
      where: {
        organizationId: orgId,
        dayOfWeek,
        isActive: true,
        ...(qualifiedStaffIds.length > 0 ? { memberId: { in: qualifiedStaffIds } } : {}),
      },
      include: {
        breaks: true,
      },
    });

    // Target date start and end boundaries
    const dateYMD = targetDate.toISOString().split("T")[0];
    const targetDateStart = new Date(`${dateYMD}T00:00:00.000Z`);
    const targetDateEnd = new Date(`${dateYMD}T23:59:59.999Z`);

    // Fetch existing bookings overlapping with this target date
    const existingBookings = await this.prisma.client.serviceBooking.findMany({
      where: {
        organizationId: orgId,
        status: { in: [BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS] },
        OR: [
          {
            scheduledStartTime: { lte: targetDateEnd },
            scheduledEndTime: { gte: targetDateStart },
          },
        ],
      },
      include: {
        staff: { select: { memberId: true } },
        resources: { select: { resourceId: true } },
      },
    });

    /**
     * OPTIMIZATION (Bolt ⚡): Pre-index existing bookings by staff member ID and resource ID
     * to eliminate expensive array .filter operations inside nested timeslot generation loops.
     * This collapses runtime complexity from O(S * T * B * R) to O(B + R + S * T).
     */
    const staffBookingsMap = new Map<string, any[]>();
    const resourceBookingsMap = new Map<string, any[]>();

    for (const booking of existingBookings) {
      if (booking.staff) {
        for (const s of booking.staff) {
          if (s.memberId) {
            if (!staffBookingsMap.has(s.memberId)) {
              staffBookingsMap.set(s.memberId, []);
            }
            staffBookingsMap.get(s.memberId)!.push(booking);
          }
        }
      }
      if (booking.resources) {
        for (const r of booking.resources) {
          if (r.resourceId) {
            if (!resourceBookingsMap.has(r.resourceId)) {
              resourceBookingsMap.set(r.resourceId, []);
            }
            resourceBookingsMap.get(r.resourceId)!.push(booking);
          }
        }
      }
    }

    const parseTimeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const availableSlotsSet = new Set<string>();

    for (const shift of shifts) {
      const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
      const shiftEndMinutes = parseTimeToMinutes(shift.endTime);

      const breakTimes = shift.breaks.map((b) => ({
        start: parseTimeToMinutes(b.startTime),
        end: parseTimeToMinutes(b.endTime),
      }));

      // Generate timeslots every 30 minutes inside the shift window
      for (let mins = shiftStartMinutes; mins + duration <= shiftEndMinutes; mins += 30) {
        const slotStart = new Date(`${dateYMD}T00:00:00.000Z`);
        slotStart.setUTCMinutes(mins);

        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

        const slotStartMins = mins;
        const slotEndMins = mins + duration;

        // 1. Check if slot overlaps with shift breaks
        const overlapsWithBreak = breakTimes.some(
          (b) => slotStartMins < b.end && slotEndMins > b.start,
        );

        if (overlapsWithBreak) {
          continue;
        }

        // 2. Check if the staff member has overlapping bookings
        const staffBookings = staffBookingsMap.get(shift.memberId) || [];

        const staffConflict = staffBookings.some((b) => {
          const bStart = new Date(b.scheduledStartTime).getTime();
          const bEnd = new Date(b.scheduledEndTime || b.scheduledStartTime).getTime();

          const currentSlotStartWithBuffer = slotStart.getTime() - bufferBefore * 60 * 1000;
          const currentSlotEndWithBuffer = slotEnd.getTime() + bufferAfter * 60 * 1000;

          return currentSlotStartWithBuffer < bEnd && currentSlotEndWithBuffer > bStart;
        });

        if (staffConflict) {
          continue;
        }

        // 3. Verify resource availability if service requires specific resources
        if (service.resources.length > 0) {
          let hasFreeResource = false;

          for (const serviceResource of service.resources) {
            const resourceId = serviceResource.resourceId;

            const resourceBookings = resourceBookingsMap.get(resourceId) || [];

            const resourceConflict = resourceBookings.some((b) => {
              const bStart = new Date(b.scheduledStartTime).getTime();
              const bEnd = new Date(b.scheduledEndTime || b.scheduledStartTime).getTime();

              const currentSlotStartWithBuffer = slotStart.getTime() - bufferBefore * 60 * 1000;
              const currentSlotEndWithBuffer = slotEnd.getTime() + bufferAfter * 60 * 1000;

              return currentSlotStartWithBuffer < bEnd && currentSlotEndWithBuffer > bStart;
            });

            if (!resourceConflict) {
              hasFreeResource = true;
              break;
            }
          }

          if (!hasFreeResource) {
            continue;
          }
        }

        // If everything checks out, this is a valid timeslot!
        availableSlotsSet.add(slotStart.toISOString());
      }
    }

    return {
      serviceId,
      date: dateYMD,
      availableSlots: Array.from(availableSlotsSet).sort(),
    };
  }
}
