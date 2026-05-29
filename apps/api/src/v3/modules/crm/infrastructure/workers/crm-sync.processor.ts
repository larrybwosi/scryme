import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { CrmSyncJobData } from '../services/crm-sync.service';

@Processor('crm-sync')
export class CrmSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CrmSyncProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<CrmSyncJobData>): Promise<any> {
    const { type, organizationId, internalId } = job.data;
    this.logger.log(`Processing CRM sync job: ${type} for org: ${organizationId}, id: ${internalId}`);

    try {
      if (type === 'SYNC_CUSTOMER') {
        return await this.syncCustomer(organizationId, internalId);
      } else if (type === 'SYNC_BUSINESS_ACCOUNT') {
        return await this.syncBusinessAccount(organizationId, internalId);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process CRM sync job ${type}: ${msg}`);
      throw error;
    }
  }

  private async syncCustomer(organizationId: string, customerId: string) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) return;

    let objectDef = await this.prisma.client.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'customer' } },
    });

    if (!objectDef) {
      objectDef = await this.prisma.client.crmObjectDefinition.create({
        data: {
          organizationId,
          name: 'customer',
          label: 'Customer',
          labelPlural: 'Customers',
          isSystem: true,
        },
      });
    }

    const data = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };

    if (customer.crmRecordId) {
      await this.prisma.client.crmRecord.update({
        where: { id: customer.crmRecordId },
        data: { data },
      });
    } else {
      const record = await this.prisma.client.crmRecord.create({
        data: {
          objectId: objectDef.id,
          organizationId,
          data,
        },
      });
      await this.prisma.client.customer.update({
        where: { id: customerId },
        data: { crmRecordId: record.id },
      });
    }
  }

  private async syncBusinessAccount(organizationId: string, businessAccountId: string) {
    const account = await this.prisma.client.businessAccount.findUnique({
      where: { id: businessAccountId },
    });

    if (!account) return;

    let objectDef = await this.prisma.client.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'business_account' } },
    });

    if (!objectDef) {
      objectDef = await this.prisma.client.crmObjectDefinition.create({
        data: {
          organizationId,
          name: 'business_account',
          label: 'Business Account',
          labelPlural: 'Business Accounts',
          isSystem: true,
        },
      });
    }

    const data = {
      name: account.name,
      taxId: account.taxId,
    };

    if (account.crmRecordId) {
      await this.prisma.client.crmRecord.update({
        where: { id: account.crmRecordId },
        data: { data },
      });
    } else {
      const record = await this.prisma.client.crmRecord.create({
        data: {
          objectId: objectDef.id,
          organizationId,
          data,
        },
      });
      await this.prisma.client.businessAccount.update({
        where: { id: businessAccountId },
        data: { crmRecordId: record.id },
      });
    }
  }
}
