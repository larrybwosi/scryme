import "server-only";
import { PrismaClient, CrmFieldType } from "@repo/db";
import { CreateObjectInput, CreateFieldInput, CachingProvider } from "../types";

export class SchemaService {
  constructor(
    private prisma: PrismaClient,
    private cache?: CachingProvider,
  ) {}

  async createObject(input: CreateObjectInput) {
    if (this.cache) {
      await this.cache.del(`crm:schema:objects:${input.organizationId}`);
    }
    return this.prisma.crmObjectDefinition.create({
      data: input,
    });
  }

  async getObjects(organizationId: string) {
    const cacheKey = `crm:schema:objects:${organizationId}`;
    if (this.cache) {
      const cached = await this.cache.get<any[]>(cacheKey);
      if (cached) return cached;
    }

    const objects = await this.prisma.crmObjectDefinition.findMany({
      where: { organizationId },
      include: { fields: { orderBy: { order: "asc" } } },
    });

    if (this.cache) {
      await this.cache.set(cacheKey, objects, 3600); // Cache for 1 hour
    }

    return objects;
  }

  async getObjectByName(organizationId: string, name: string) {
    const cacheKey = `crm:schema:object:${organizationId}:${name}`;
    if (this.cache) {
      const cached = await this.cache.get<any>(cacheKey);
      if (cached) return cached;
    }

    const object = await this.prisma.crmObjectDefinition.findUnique({
      where: {
        organizationId_name: { organizationId, name },
      },
      include: { fields: { orderBy: { order: "asc" } } },
    });

    if (object && this.cache) {
      await this.cache.set(cacheKey, object, 3600);
    }

    return object;
  }

  async createField(input: CreateFieldInput, organizationId: string) {
    const obj = await this.prisma.crmObjectDefinition.findUnique({
      where: { id: input.objectId, organizationId },
    });
    if (obj && this.cache) {
      await this.cache.del(`crm:schema:objects:${obj.organizationId}`);
      await this.cache.del(
        `crm:schema:object:${obj.organizationId}:${obj.name}`,
      );
    }
    return this.prisma.crmFieldDefinition.create({
      data: input,
    });
  }

  async deleteObject(id: string, organizationId: string) {
    const obj = await this.prisma.crmObjectDefinition.findFirst({
      where: { id, organizationId },
    });
    if (!obj) throw new Error("Object not found");
    if (obj.isSystem) throw new Error("Cannot delete system objects");

    if (this.cache) {
      await this.cache.del(`crm:schema:objects:${organizationId}`);
      await this.cache.del(`crm:schema:object:${organizationId}:${obj.name}`);
    }

    return this.prisma.crmObjectDefinition.delete({ where: { id: obj.id } });
  }

  async seedStandardObjects(organizationId: string) {
    // Standard Person Object
    const person = await this.createObject({
      name: "person",
      label: "Person",
      labelPlural: "People",
      icon: "User",
      organizationId,
      isSystem: true,
    });

    const personFields: CreateFieldInput[] = [
      {
        objectId: person.id,
        name: "firstName",
        label: "First Name",
        type: CrmFieldType.TEXT,
        isRequired: true,
        order: 1,
        isSystem: true,
      },
      {
        objectId: person.id,
        name: "lastName",
        label: "Last Name",
        type: CrmFieldType.TEXT,
        isRequired: true,
        order: 2,
        isSystem: true,
      },
      {
        objectId: person.id,
        name: "email",
        label: "Email",
        type: CrmFieldType.EMAIL,
        isUnique: true,
        order: 3,
        isSystem: true,
      },
      {
        objectId: person.id,
        name: "phone",
        label: "Phone",
        type: CrmFieldType.PHONE,
        order: 4,
        isSystem: true,
      },
      {
        objectId: person.id,
        name: "notes",
        label: "Notes",
        type: CrmFieldType.TEXT,
        order: 5,
        isSystem: true,
      },
    ];

    for (const field of personFields) {
      await this.createField(field, organizationId);
    }

    // Standard Company Object
    const company = await this.createObject({
      name: "company",
      label: "Company",
      labelPlural: "Companies",
      icon: "Building",
      organizationId,
      isSystem: true,
    });

    const companyFields: CreateFieldInput[] = [
      {
        objectId: company.id,
        name: "name",
        label: "Name",
        type: CrmFieldType.TEXT,
        isRequired: true,
        order: 1,
        isSystem: true,
      },
      {
        objectId: company.id,
        name: "domain",
        label: "Domain",
        type: CrmFieldType.URL,
        order: 2,
        isSystem: true,
      },
      {
        objectId: company.id,
        name: "industry",
        label: "Industry",
        type: CrmFieldType.TEXT,
        order: 3,
        isSystem: true,
      },
      {
        objectId: company.id,
        name: "notes",
        label: "Notes",
        type: CrmFieldType.TEXT,
        order: 4,
        isSystem: true,
      },
    ];

    for (const field of companyFields) {
      await this.createField(field, organizationId);
    }

    // Standard Relationship: Company -> People
    await this.prisma.crmRelationshipDefinition.create({
      data: {
        organizationId,
        name: "company_people",
        type: "ONE_TO_MANY",
        sourceObjectId: company.id,
        targetObjectId: person.id,
        sourceLabel: "Employees",
        targetLabel: "Company",
      },
    });

    return { person, company };
  }
}
