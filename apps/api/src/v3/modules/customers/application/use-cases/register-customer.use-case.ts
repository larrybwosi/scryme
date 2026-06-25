import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ICustomerRepository } from "../../domain/repositories/customer-repository.interface";
import { RegisterCustomerDto } from "../dto/register-customer.dto";
import { Customer } from "../../domain/entities/customer.entity";
import { PrismaService } from "@/prisma/prisma.service";
import { ZitadelService } from "@repo/zitadel/server";
import { randomUUID } from "crypto";
import { emitCustomerCreated } from "@repo/windmill/server";
import { CrmSyncService } from "../../../crm/infrastructure/services/crm-sync.service";

@Injectable()
export class RegisterCustomerUseCase {
  private readonly logger = new Logger(RegisterCustomerUseCase.name);

  constructor(
    @Inject(ICustomerRepository)
    private readonly customerRepository: ICustomerRepository,
    private readonly prisma: PrismaService,
    private readonly crmSyncService: CrmSyncService,
  ) {}

  async execute(organizationId: string, dto: RegisterCustomerDto) {
    this.logger.log(
      `Registering customer for organization ${organizationId}: ${dto.email}`,
    );

    await this.verifyZitadelUser(dto.zitadelUserId);

    const result = await this.prisma.client.$transaction(async (tx) => {
      const internalId = await this.getOrCreateInternalMapping(
        tx,
        organizationId,
        dto.zitadelUserId,
      );
      const customer = await this.upsertCustomer(
        tx,
        internalId,
        organizationId,
        dto,
      );

      if (dto.address) {
        await this.handleStructuredAddress(tx, customer.id, dto.address);
      }

      return {
        id: internalId,
        name: dto.name,
        email: dto.email,
        organizationId,
      };
    });

    await this.triggerExternalAutomations(organizationId, result);

    return new Customer(
      result.id,
      result.name,
      result.email,
      null,
      result.organizationId,
      new Date(),
      new Date(),
    );
  }

  private async verifyZitadelUser(zitadelUserId: string) {
    const zitadelSvc = new ZitadelService();
    try {
      const user = await zitadelSvc.getUser(zitadelUserId);
      if (!user)
        throw new NotFoundException(
          `Zitadel user with ID ${zitadelUserId} not found`,
        );
    } catch (e) {
      throw new NotFoundException(
        `Zitadel user with ID ${zitadelUserId} not found`,
      );
    }
  }

  private async getOrCreateInternalMapping(
    tx: any,
    organizationId: string,
    zitadelUserId: string,
  ) {
    const mapping = await tx.externalMapping.findFirst({
      where: {
        organizationId,
        provider: "ZITADEL",
        externalId: zitadelUserId,
        entityType: "CUSTOMER",
      },
    });

    if (mapping) return mapping.internalId!;

    const internalId = randomUUID();
    await tx.externalMapping.create({
      data: {
        organizationId,
        internalId,
        externalId: zitadelUserId,
        provider: "ZITADEL",
        entityType: "CUSTOMER",
      },
    });
    return internalId;
  }

  private async upsertCustomer(
    tx: any,
    internalId: string,
    organizationId: string,
    dto: RegisterCustomerDto,
  ) {
    const customerData = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      organizationId,
      isActive: true,
      pinnedLocation: dto.location ? { address: dto.location } : undefined,
      deliveryNotes: dto.metadata ? JSON.stringify(dto.metadata) : undefined,
    };

    return tx.customer.upsert({
      where: { id: internalId },
      create: { id: internalId, ...customerData },
      update: customerData,
    });
  }

  private async handleStructuredAddress(
    tx: any,
    customerId: string,
    addressDto: any,
  ) {
    const addressData = {
      type: "BOTH" as const,
      label: addressDto.label,
      street1: addressDto.street1,
      street2: addressDto.street2,
      city: addressDto.city,
      state: addressDto.state,
      postalCode: addressDto.postalCode,
      country: addressDto.country,
      isDefault: addressDto.isDefault ?? true,
    };

    const existingAddress = await tx.address.findFirst({
      where: {
        customerId,
        street1: addressDto.street1,
        city: addressDto.city,
        postalCode: addressDto.postalCode,
      },
    });

    if (existingAddress) {
      await tx.address.update({
        where: { id: existingAddress.id },
        data: addressData,
      });
    } else {
      await tx.address.create({ data: { customerId, ...addressData } });
    }
  }

  private async triggerExternalAutomations(
    organizationId: string,
    result: { id: string; name: string; email: string },
  ) {
    try {
      await this.crmSyncService.enqueueSyncCustomer(organizationId, result.id);

      await emitCustomerCreated(organizationId, {
        customerId: result.id,
        name: result.name,
        email: result.email,
      }).catch((err) =>
        this.logger.warn(
          `Failed to trigger Windmill for customer ${result.id}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    } catch (e) {
      this.logger.error(
        `Failed to trigger external automations: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
