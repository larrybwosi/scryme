import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ActivityLogger } from '@repo/crm/server';
import { CrmActivity } from '@repo/db';

@Injectable()
export class CrmActivityService implements ActivityLogger {
  constructor(private readonly prisma: PrismaService) {}

  async logActivity(input: {
    recordId: string;
    organizationId: string;
    type: string;
    description?: string;
    metadata?: any;
    memberId?: string;
  }): Promise<CrmActivity> {
    return this.prisma.client.crmActivity.create({
      data: {
        recordId: input.recordId,
        organizationId: input.organizationId,
        type: input.type,
        description: input.description,
        metadata: input.metadata,
        memberId: input.memberId,
      },
    });
  }
}
