import { Injectable, Logger } from "@nestjs/common";
import {
  CustomermatesClient,
  mapRecordValues,
  type CustomermatesListKind,
} from "@repo/customermates";
import { PrismaService } from "@/prisma/prisma.service";
import { decryptCredentials, getSettings } from "../domain/customermates-context";
import { CustomermatesMetricsService } from "./customermates-metrics.service";
import { CustomermatesSyncService } from "./customermates-sync.service";

const RECONCILE_KINDS: CustomermatesListKind[] = ["contact", "organization", "deal"];

@Injectable()
export class CustomermatesReconciliationService {
  private readonly logger = new Logger(CustomermatesReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: CustomermatesSyncService,
    private readonly metrics: CustomermatesMetricsService,
  ) {}

  async runAll() {
    const integrations = await this.prisma.client.organizationIntegration.findMany({
      where: {
        isActive: true,
        integrationDefinition: { slug: "customermates" },
      },
      select: { id: true, organizationId: true },
    });
    for (const integration of integrations) {
      await this.runIntegration(integration.id, integration.organizationId);
    }
    return { integrations: integrations.length };
  }

  private async runIntegration(integrationId: string, organizationId: string) {
    const integration = await this.prisma.client.organizationIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) return;

    const settings = getSettings(integration.settings);
    const credentials = decryptCredentials(integration.credentials);
    const client = new CustomermatesClient({
      baseUrl: credentials.baseUrl,
      apiKey: credentials.apiKey,
      expectedRevision: settings.schemaRevision,
    });

    for (const kind of RECONCILE_KINDS) {
      const typeId = settings.listKinds[kind];
      if (!typeId) continue;
      try {
        const result = await client.recordsQuery({
          typeId,
          page: 1,
          pageSize: 100,
          expectedRevision: settings.schemaRevision,
        });
        for (const record of result.records) {
          const ref = record.ref || {
            typeId: record.typeId || typeId,
            recordId: String(record.recordId || record.id || ""),
          };
          if (!ref.typeId || !ref.recordId) continue;
          await this.sync.syncRemoteRecord({
            organizationId,
            integration,
            settings,
            client,
            kind,
            typeId: ref.typeId,
            recordId: ref.recordId,
            version: record.version ?? null,
            remoteTimestamp: (record.updatedAt as string) ?? null,
            values: mapRecordValues(record, settings.fieldIds),
            raw: record,
            receivedAt: new Date(),
            source: "reconcile",
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Customermates reconcile ${kind} failed for organization ${organizationId}: ${message}`);
        await this.metrics.recordFailure(organizationId, `reconcile:${kind}`, {
          integrationId,
          error: message,
        });
      }
    }

    await this.prisma.client.organizationIntegration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date(), syncMessage: "Nightly reconciliation complete" },
    });
  }
}
