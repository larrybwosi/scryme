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
  businessAccountId?: string | null;
  customerId?: string | null;
  sessionId?: string | null;
  customer?: {
    id: string;
    email?: string;
    name?: string;
  } | null;
}
