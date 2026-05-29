export interface WindmillWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface WindmillJob {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: any;
  error?: string;
}

export interface WindmillExecutionOptions<T = any> {
  organizationId: string;
  scriptPath: string;
  data: T;
  dealioEventType: string;
  correlationId?: string;
  callbackUrl?: string;
}

export interface WindmillCallbackPayload {
  jobId: string;
  status: 'COMPLETED' | 'FAILED';
  result?: any;
  error?: string;
  organizationId: string;
  correlationId: string;
  completedAt: string;
}

export interface ApprovalCallbackPayload extends WindmillCallbackPayload {
  decision: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW';
  entityId: string;
  entityType: 'PurchaseOrder' | 'Expense' | 'StockAdjustment';
  workflowRef: string;
  decidedBy?: string;
  comments?: string;
  triggeredAt: string;
}

export interface BakeryDisposalCallbackPayload extends WindmillCallbackPayload {
  batchId: string;
  action: 'DISPOSE' | 'REPURPOSE' | 'QUALITY_CHECK';
  disposalReason?: string;
  notes?: string;
  decidedBy?: string;
  workflowRef: string;
  triggeredAt: string;
}

export interface GenericOutcomePayload extends WindmillCallbackPayload {
  workflowRef: string;
  summary: string;
  outputData?: any;
  errorMessage?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  triggeredAt: string;
}

export interface WindmillSaveConfigInput {
  WindmillBaseUrl: string;
  WindmillApiKey: string;
  webhookSecret: string;
}

export interface WindmillHealthCheckResponse {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export type WindmillParameterType = 'string' | 'number' | 'boolean' | 'select' | 'date';

export interface WindmillScriptParameter {
  name: string;
  label: string;
  type: WindmillParameterType;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

export interface WindmillTemplate {
  path: string;
  name: string;
  description?: string;
  category: string;
  parameters: WindmillScriptParameter[];
}
