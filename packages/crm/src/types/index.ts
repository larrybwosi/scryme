import { CrmFieldType, CrmRelationshipType } from '@repo/db/client';

export type {
  CrmObjectDefinition,
  CrmFieldDefinition,
  CrmRecord,
  CrmRelationshipDefinition,
  CrmAssociation,
} from '@repo/db/client';

export { CrmFieldType, CrmRelationshipType };
export * from './infrastructure';

export interface CreateObjectInput {
  name: string;
  label: string;
  labelPlural: string;
  description?: string;
  icon?: string;
  organizationId: string;
  isSystem?: boolean;
}

export interface CreateFieldInput {
  objectId: string;
  name: string;
  label: string;
  type: CrmFieldType;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: any;
  options?: any;
  isSystem?: boolean;
  order?: number;
}

export interface CreateRecordInput {
  objectId: string;
  organizationId: string;
  data: Record<string, any>;
  ownerId?: string;
}
