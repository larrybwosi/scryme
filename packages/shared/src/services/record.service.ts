import "server-only";
import { Prisma, PrismaClient, CrmFieldType } from "@repo/db";
import { CreateRecordInput, ActivityLogger, CachingProvider } from "../types/crm";

type PrismaOrTx = PrismaClient | Prisma.TransactionClient;

export class RecordService {
  constructor(
    private prisma: PrismaOrTx,
    private logger?: ActivityLogger,
    private cache?: CachingProvider,
  ) {}

  // fallow-ignore-next-line unused-class-members
  setPrisma(prisma: PrismaOrTx) {
    this.prisma = prisma;
  }

  private async validateData(
    objectId: string,
    organizationId: string,
    data: Record<string, any>,
    excludeRecordId?: string,
  ) {
    const objectDef = await this.prisma.crmObjectDefinition.findUnique({
      where: { id: objectId },
      include: { fields: true },
    });

    if (!objectDef) throw new Error("Object definition not found");

    for (const field of objectDef.fields) {
      const value = data[field.name];

      // Check required
      if (
        field.isRequired &&
        (value === undefined || value === null || value === "")
      ) {
        throw new Error(`${field.label} is required`);
      }

      // Type validation and Uniqueness check
      if (value !== undefined && value !== null && value !== "") {
        if (field.type === CrmFieldType.NUMBER && isNaN(Number(value))) {
          throw new Error(`${field.label} must be a number`);
        }

        if (field.isUnique) {
          // Efficiently check for existing values in the JSONB column
          const duplicate = await this.prisma.crmRecord.findFirst({
            where: {
              objectId,
              organizationId,
              id: excludeRecordId ? { not: excludeRecordId } : undefined,
              data: {
                path: [field.name],
                equals: value,
              },
            },
          });

          if (duplicate) {
            throw new Error(`${field.label} "${value}" already exists`);
          }
        }
      }
    }
  }

  async createRecord(input: CreateRecordInput) {
    await this.validateData(input.objectId, input.organizationId, input.data);

    const record = await this.prisma.crmRecord.create({
      data: {
        objectId: input.objectId,
        organizationId: input.organizationId,
        data: input.data,
        ownerId: input.ownerId,
      },
      include: {
        objectDefinition: true,
      },
    });

    if (this.logger) {
      await this.logger.logActivity({
        recordId: record.id,
        organizationId: record.organizationId,
        type: "CREATION",
        description: `Created new ${record.objectDefinition.label}`,
        memberId: input.ownerId,
      });
    }

    return record;
  }

  /**
   * Optimized: Fetch records with optional pagination.
   * PERFORMANCE: Removed redundant objectDefinition include. The client already
   * possesses the schema for the current object view, and sending it for
   * every record in a large list is O(N) overhead.
   */
  async getRecords(
    objectId: string,
    organizationId: string,
    limit?: number,
    offset?: number,
  ) {
    const [records, total] = await Promise.all([
      this.prisma.crmRecord.findMany({
        where: {
          objectId,
          organizationId,
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.crmRecord.count({
        where: {
          objectId,
          organizationId,
        },
      }),
    ]);

    return { records, total };
  }

  // fallow-ignore-next-line unused-class-members
  async getRecord(id: string, organizationId?: string) {
    const cacheKey = `crm:record:${id}`;
    if (this.cache) {
      const cached = await this.cache.get<any>(cacheKey);
      if (
        cached &&
        (!organizationId || cached.organizationId === organizationId)
      ) {
        return cached;
      }
    }

    const record = await this.prisma.crmRecord.findFirst({
      where: { id, organizationId },
      include: {
        objectDefinition: {
          include: { fields: { orderBy: { order: "asc" } } },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { member: { include: { user: true } } },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { createdBy: { include: { user: true } } },
        },
      },
    });

    if (record && this.cache) {
      await this.cache.set(cacheKey, record, 300); // Cache for 5 mins
    }

    return record;
  }

  // fallow-ignore-next-line unused-class-members
  async updateRecord(
    id: string,
    data: Record<string, any>,
    organizationId: string,
    memberId?: string,
  ) {
    if (this.cache) {
      await this.cache.del(`crm:record:${id}`);
    }

    const record = await this.prisma.crmRecord.findFirst({
      where: { id, organizationId },
      include: { objectDefinition: true },
    });
    if (!record) throw new Error("Record not found");

    const oldData = record.data as Record<string, any>;
    const newData = { ...oldData, ...data };
    await this.validateData(
      record.objectId,
      record.organizationId,
      newData,
      id,
    );

    const updated = await this.prisma.crmRecord.update({
      where: { id },
      data: { data: newData },
    });

    if (this.logger) {
      const changedFields = Object.keys(data).filter(
        (key) => oldData[key] !== data[key],
      );

      await this.logger.logActivity({
        recordId: record.id,
        organizationId: record.organizationId,
        type: "UPDATE",
        description: `Updated ${record.objectDefinition.label}: ${changedFields.join(", ")}`,
        metadata: { oldData, newData: data },
        memberId,
      });
    }

    return updated;
  }

  // fallow-ignore-next-line unused-class-members
  async deleteRecord(id: string, organizationId: string) {
    if (this.cache) {
      await this.cache.del(`crm:record:${id}`);
    }

    const record = await this.prisma.crmRecord.findFirst({
      where: { id, organizationId },
    });

    if (!record) throw new Error("Record not found");

    return this.prisma.crmRecord.delete({ where: { id: record.id } });
  }

  // fallow-ignore-next-line unused-class-members
  async addNote(input: {
    recordId: string;
    organizationId: string;
    content: string;
    createdById?: string;
  }) {
    const note = await this.prisma.crmNote.create({
      data: input,
    });

    if (this.cache) {
      await this.cache.del(`crm:record:${input.recordId}`);
    }

    if (this.logger) {
      await this.logger.logActivity({
        recordId: input.recordId,
        organizationId: input.organizationId,
        type: "NOTE",
        description: "Added a note",
        memberId: input.createdById,
      });
    }

    return note;
  }
}
