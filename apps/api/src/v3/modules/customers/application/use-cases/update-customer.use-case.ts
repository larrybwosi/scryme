import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { Customer } from "../../domain/entities/customer.entity";
import { PrismaService } from "@/prisma/prisma.service";
import { CustomermatesWritebackService } from "../../../crm-integrations/customermates/application/customermates-writeback.service";
import type { FieldChangeSet } from "@repo/customermates";

@Injectable()
export class UpdateCustomerUseCase {
  private readonly logger = new Logger(UpdateCustomerUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customermatesWriteback: CustomermatesWritebackService,
  ) {}

  async execute(
    organizationId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ) {
    this.logger.log(
      `Updating customer ${customerId} for organization ${organizationId}`,
    );

    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, organizationId },
      // Use targeted select for verification to reduce database payload.
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const changes: FieldChangeSet = {};
    if (dto.name !== undefined) changes.name = dto.name;
    if (dto.email !== undefined) changes.email = dto.email || undefined;
    if (dto.phone !== undefined) changes.phone = dto.phone || undefined;
    await this.customermatesWriteback.assertWritable(organizationId, customerId);

    // SECURITY: BOLA / Tenant Isolation Mitigation - Customer lacks a composite unique index on [id, organizationId].
    // Prisma's update query with { where: { id: customerId } } ignores non-unique organizationId filters in 'where' clause at runtime.
    // Using updateMany scoped strictly by { id: customerId, organizationId } guarantees database-level multi-tenant isolation,
    // preventing potential cross-tenant IDOR customer record modifications or race conditions.
    const updateResult = await this.prisma.client.customer.updateMany({
      where: { id: customerId, organizationId },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        customerType: dto.customerType,
        dateOfBirth: dto.dateOfBirth,
        taxId: dto.taxId,
        pinnedLocation: dto.location ? { address: dto.location } : undefined,
        deliveryNotes: dto.metadata ? JSON.stringify(dto.metadata) : undefined,
      },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    try {
      await this.customermatesWriteback.enqueueFromCustomerUpdate(
        organizationId,
        customerId,
        changes,
      );
    } catch (error) {
      if ((error as Error).message.includes("error state")) {
        throw new ConflictException("Customermates integration is in error state");
      }
      this.logger.warn(`Customermates write back was not queued: ${(error as Error).message}`);
    }

    const updatedCustomer = await this.prisma.client.customer.findFirstOrThrow({
      where: { id: customerId, organizationId },
      // Use targeted select for the updated record
      // to reduce database payload and serialization overhead.
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        customerType: true,
        dateOfBirth: true,
        taxId: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new Customer(
      updatedCustomer.id,
      updatedCustomer.name,
      updatedCustomer.email || "",
      updatedCustomer.phone,
      updatedCustomer.organizationId,
      updatedCustomer.createdAt,
      updatedCustomer.updatedAt,
      updatedCustomer.company,
      updatedCustomer.customerType,
      updatedCustomer.dateOfBirth,
      updatedCustomer.taxId,
    );
  }
}
