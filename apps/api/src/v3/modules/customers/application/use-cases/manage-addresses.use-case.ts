import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AddressDto } from "../dto/register-customer.dto";

@Injectable()
export class ManageAddressesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCustomerExists(organizationId: string, customerId: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, organizationId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
  }

  async getAddresses(organizationId: string, customerId: string) {
    await this.ensureCustomerExists(organizationId, customerId);

    return this.prisma.client.address.findMany({
      where: { customerId },
    });
  }

  async addAddress(organizationId: string, customerId: string, dto: AddressDto) {
    await this.ensureCustomerExists(organizationId, customerId);

    const addressData = {
      type: "BOTH" as const,
      label: dto.label,
      street1: dto.street1,
      street2: dto.street2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
      isDefault: dto.isDefault ?? true,
    };

    const existingAddress = await this.prisma.client.address.findFirst({
      where: {
        customerId,
        street1: dto.street1,
        city: dto.city,
        postalCode: dto.postalCode,
      },
    });

    if (existingAddress) {
      return this.prisma.client.address.update({
        where: { id: existingAddress.id },
        data: addressData,
      });
    } else {
      return this.prisma.client.address.create({
        data: { customerId, ...addressData },
      });
    }
  }
}
