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
  authType: "device" | "member" | "zitadel" | "oauth" | "hybrid";
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
