/**
 * Standard interface for all third-party integrations in the Dealio ecosystem.
 * Each integration package should implement this interface to ensure consistency.
 */

export interface IntegrationStatus {
  isActive: boolean;
  health: 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED' | 'UNKNOWN';
  lastSyncAt?: Date | string | null;
  error?: string | null;
}

export interface IntegrationConnectionResult {
  success: boolean;
  status: IntegrationStatus;
  message?: string;
}

export interface BaseIntegrationService<TConfig, TSyncResult = any> {
  /**
   * Tests the connection with the provided configuration.
   * Does not persist any data.
   */
  testConnection(config: TConfig): Promise<IntegrationConnectionResult>;

  /**
   * Retrieves the current status of the integration for an organization.
   */
  getStatus(organizationId: string): Promise<IntegrationStatus>;

  /**
   * Triggers a synchronization process for the integration.
   */
  sync?(organizationId: string): Promise<TSyncResult>;

  /**
   * Gracefully shuts down or invalidates any active connections/clients for an organization.
   */
  disconnect(organizationId: string): Promise<void>;
}
