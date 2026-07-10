import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateCrmObjectDto,
  CreateCrmFieldDto,
} from "../dto/crm-definitions.dto";

@Injectable()
export class CrmDefinitionService {
  constructor(private readonly prisma: PrismaService) {}

  async createObjectDefinition(
    organizationId: string,
    dto: CreateCrmObjectDto,
  ) {
    const existing = await this.prisma.client.crmObjectDefinition.findFirst({
      where: { organizationId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Object definition with name "${dto.name}" already exists`,
      );
    }

    return this.prisma.client.crmObjectDefinition.create({
      data: {
        name: dto.name,
        label: dto.label,
        labelPlural: dto.labelPlural,
        description: dto.description,
        icon: dto.icon,
        organizationId,
      },
    });
  }

  async getObjectDefinitions(organizationId: string) {
    return this.prisma.client.crmObjectDefinition.findMany({
      where: { organizationId },
      include: { fields: { orderBy: { order: "asc" } } },
    });
  }

  async createFieldDefinition(
    organizationId: string,
    objectId: string,
    dto: CreateCrmFieldDto,
  ) {
    const object = await this.prisma.client.crmObjectDefinition.findFirst({
      where: { id: objectId, organizationId },
    });

    if (!object) {
      throw new NotFoundException("Object definition not found");
    }

    return this.prisma.client.crmFieldDefinition.create({
      data: {
        name: dto.name,
        label: dto.label,
        type: dto.type,
        isRequired: dto.isRequired,
        options: dto.options,
        order: dto.order,
        objectId,
      },
    });
  }

  async getFieldsForObject(organizationId: string, objectId: string) {
    const object = await this.prisma.client.crmObjectDefinition.findFirst({
      where: { id: objectId, organizationId },
    });

    if (!object) {
      throw new NotFoundException("Object definition not found");
    }

    return this.prisma.client.crmFieldDefinition.findMany({
      where: { objectId },
      orderBy: { order: "asc" },
    });
  }
}
