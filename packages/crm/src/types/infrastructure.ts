import { CrmActivity, CrmNote } from '@repo/db/client';

export interface ActivityLogger {
  logActivity(input: {
    recordId: string;
    organizationId: string;
    type: string;
    description?: string;
    metadata?: any;
    memberId?: string;
  }): Promise<CrmActivity>;
}

export interface CachingProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<any>;
}
