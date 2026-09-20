import type { V3ApiContext } from "../../v3/types/context";

export interface V2ApiContext {
  organizationId: string;
  deviceId?: string;
  deviceName?: string;
  locationId?: string;
  memberId?: string;
  memberName?: string;
  userId?: string;
  role?: string;
  apiKeyId?: string;
  customerId?: string;
  authType: "device" | "member" | "oauth" | "hybrid";
  permissions: string[];
  scopes: string[];
  jwtPayload?: any;
  correlationId: string;
  ipAddress: string;
  userAgent: string;
  requestStartTime: number;
}

export type { V3ApiContext };
