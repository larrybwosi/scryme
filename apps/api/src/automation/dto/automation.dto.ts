export interface CreateWorkflowDefinitionDto {
  key: string;
  name: string;
  description?: string;
  triggerType?: "EVENT" | "WEBHOOK" | "SCHEDULED" | "MANUAL";
  config?: Record<string, any>;
  isActive?: boolean;
}

export interface TriggerWorkflowDto {
  key: string;
  payload?: Record<string, any>;
  correlationId?: string;
}

export interface CreateWebhookDto {
  name: string;
  direction?: "INCOMING" | "OUTGOING";
  endpointUrl: string;
  secret?: string;
  headers?: Record<string, any>;
  definitionId?: string;
}
