import { ZitadelConnectionStatus } from '@repo/db';

export interface ZitadelConfigDto {
  id: string;
  organizationId: string;
  zitadelOrgId: string | null;
  zitadelProjectId: string | null;
  zitadelAppId: string | null;
  isActive: boolean;
  autoSyncOnRegister: boolean;
  autoSyncOnSignIn: boolean;
  syncToTwentyCrm: boolean;
  syncToErpCustomer: boolean;
  connectionStatus: ZitadelConnectionStatus;
  connectionError: string | null;
  lastTestedAt: Date | null;
  lastSyncAt: Date | null;
  totalUsersSynced: number;
}

export interface ZitadelStats {
  totalUsersSynced: number;
  webhookLogsTotal: number;
  webhookLogsProcessed: number;
  webhookLogsFailed: number;
  webhookLogsPending: number;
  lastSyncAt: string | null;
}
