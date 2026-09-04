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
import { randomUUID } from "crypto";
import { emitCustomerCreated } from "@repo/shared/server";
import { CrmSyncService } from "../../../crm/infrastructure/services/crm-sync.service";
import { LoyaltyService } from "../../../loyalty/application/loyalty.service";
import * as bcrypt from "bcryptjs";
import { env } from "@repo/env";

@Injectable()
export class RegisterCustomerUseCase {
  private readonly logger = new Logger(RegisterCustomerUseCase.name);

  constructor(
    @Inject(ICustomerRepository)
    private readonly customerRepository: ICustomerRepository,
    private readonly prisma: PrismaService,
    private readonly crmSyncService: CrmSyncService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async execute(organizationId: string, dto: RegisterCustomerDto, contextInfo?: { authType?: string; clientId?: string }) {
    this.logger.log(
      `Registering customer for organization ${organizationId}: ${dto.email}`,
    );

    const result = await this.prisma.client.$transaction(async (tx) => {
      let internalId: string;
      const cleanEmail = dto.email?.trim() || null;
      if (cleanEmail) {
        const existing = await tx.customer.findFirst({
          where: {
            organizationId,
            email: cleanEmail,
          },
          select: { id: true },
        });
        internalId = existing ? existing.id : randomUUID();
      } else {
        internalId = randomUUID();
      }

      // Security: Check if customer with this email already exists in this organization
      const existingCustomer = await tx.customer.findUnique({
        where: {
          organizationId_email: {
            organizationId,
            email: dto.email,
          },
        },
      });

      if (existingCustomer && existingCustomer.id !== internalId) {
        throw new BadRequestException(
          "A customer with this email already exists",
        );
      }

      // Check if password is provided to create a linked user account or save password details
      let hashedPassword = undefined;
      if (dto.password) {
        hashedPassword = await bcrypt.hash(dto.password, 10);
      }

      const customer = await this.upsertCustomer(
        tx,
        internalId,
        organizationId,
        dto,
        hashedPassword,
        contextInfo,
      );

      if (dto.address) {
        await this.handleStructuredAddress(tx, customer.id, dto.address);
      }

      // If registered by a connected app / api client on behalf of the customer, create external mapping
      if (contextInfo?.clientId) {
        const client = await tx.v3ApiClient.findUnique({
          where: { clientId: contextInfo.clientId },
          include: { organization: true },
        });
        if (client) {
          const integration = await tx.organizationIntegration.findFirst({
            where: {
              organizationId,
              integrationDefinition: { slug: client.name.toLowerCase() },
            },
          });

          await tx.externalMapping.upsert({
            where: {
              organizationId_provider_externalId_entityType: {
                organizationId,
                provider: client.name.toUpperCase(),
                externalId: internalId,
                entityType: "CUSTOMER",
              },
            },
            create: {
              organizationId,
              organizationIntegrationId: integration?.id || null,
              internalEntityType: "Customer",
              internalId,
              externalId: internalId,
              entityType: "CUSTOMER",
              provider: client.name.toUpperCase(),
            },
            update: {
              organizationIntegrationId: integration?.id || null,
            },
          });
        }
      }

      return {
        id: internalId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        customerType: customer.customerType,
        dateOfBirth: customer.dateOfBirth,
        taxId: customer.taxId,
        organizationId,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      };
    });

    await this.triggerExternalAutomations(organizationId, result);

    // Auto-enroll in loyalty program
    try {
      await this.loyaltyService.handleCustomerSignup(organizationId, result.id);
    } catch (e) {
      this.logger.warn(`Failed to auto-enroll customer ${result.id} in loyalty program: ${e instanceof Error ? e.message : String(e)}`);
    }

    return new Customer(
      result.id,
      result.name,
      result.email,
      result.phone,
      result.organizationId,
      result.createdAt || new Date(),
      result.updatedAt || new Date(),
      result.company,
      result.customerType,
      result.dateOfBirth,
      result.taxId,
    );
  }


  private async upsertCustomer(
    tx: any,
    internalId: string,
    organizationId: string,
    dto: RegisterCustomerDto,
    hashedPassword?: string,
    contextInfo?: { authType?: string; clientId?: string },
  ) {
    const isApiCreated = contextInfo?.clientId || contextInfo?.authType === "v3_client" || contextInfo?.authType === "v3_hybrid";

    const customerData = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      company: dto.company,
      customerType: dto.customerType,
      dateOfBirth: dto.dateOfBirth,
      taxId: dto.taxId,
      organizationId,
      isActive: true,
      pinnedLocation: dto.location ? { address: dto.location } : undefined,
      deliveryNotes: dto.metadata ? JSON.stringify(dto.metadata) : undefined,
      creationType: isApiCreated ? "API_CREATED" as any : "SELF_REGISTERED" as any,
    };

    // If password is provided, also upsert/create a linked credentials user
    if (hashedPassword) {
      // Find or create linked User record
      const linkedUser = await tx.user.upsert({
        where: { email: dto.email },
        create: {
          id: randomUUID(),
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role: "CLIENT" as any,
          activeOrganizationId: organizationId,
        },
        update: {
          password: hashedPassword,
        },
      });
    }

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
      }).catch(err =>
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
