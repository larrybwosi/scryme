export interface V2ApiContext {
  openObserveService?: any; // Using any here to avoid circular dependency with API service
  organizationId: string;
  deviceId?: string;
  deviceName?: string;
  locationId?: string;
  memberId?: string;
  memberName?: string;
  userId?: string;
  role?: string;
  apiKeyId?: string;
  zitadelUserId?: string;
  customerId?: string;
  authType: 'device' | 'member' | 'zitadel' | 'oauth' | 'hybrid';
  permissions: string[];
  scopes: string[];
  jwtPayload?: any;
  correlationId: string;
  ipAddress: string;
  userAgent: string;
  requestStartTime: number;
}

export interface V3ApiContext {
  organizationId: string;
  orgSlug: string;
  clientId: string;
  memberId?: string;
  deviceId?: string;
  locationId?: string;
  scopes: string[];
  authType: string;
  organization: any;
  permissions: string[];
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ['*'],
  ADMIN: ['*'],
  MANAGER: [
    'product:read:all',
    'product:manage:stock',
    'product:view:stock_levels',
    'sale:read:location',
    'inventory_location:read:all',
    'bakery:recipe:view',
    'bakery:batch:view',
    'bakery:batch:manage',
    'bakery:template:view',
  ],
  BAKER: [
    'bakery:recipe:view',
    'bakery:batch:view',
    'bakery:batch:manage',
    'bakery:template:view',
    'product:view:stock_levels',
  ],
  STAFF: ['sale:create', 'product:read:all', 'product:view:stock_levels', 'customer:read:all'],
};
