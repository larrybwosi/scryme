export interface CreateWorkflowDefinitionDto {
  key: string;
  name: string;
  description?: string;
  triggerType?: "EVENT" | "WEBHOOK" | "SCHEDULED" | "MANUAL";
  config?: Record<string, any>;
  isActive?: boolean;
}

export interface TriggerWorkflowDto {
  key?: string;
  path?: string;
  payload?: Record<string, any>;
  inputs?: Record<string, any>;
  correlationId?: string;
}

export interface SimulateWorkflowDto {
  key?: string;
  path?: string;
  config?: Record<string, any>;
  payload?: Record<string, any>;
  inputs?: Record<string, any>;
}

export interface ReplayWorkflowDto {
  executionId: string;
  overridePayload?: Record<string, any>;
}

export interface CreateWebhookDto {
  name: string;
  direction?: "INCOMING" | "OUTGOING";
  endpointUrl: string;
  secret?: string;
  headers?: Record<string, any>;
  definitionId?: string;
}
