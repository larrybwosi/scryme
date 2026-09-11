import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  organizationId: string | null;
  isSuperAdmin?: boolean;
  bypassIsolation?: boolean;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

export function runWithTenant<T>(
  context: TenantContext,
  fn: () => Promise<T> | T
): Promise<T> | T {
  return tenantStorage.run(context, fn);
}

export function runWithSystemBypass<T>(
  fn: () => Promise<T> | T
): Promise<T> | T {
  return tenantStorage.run(
    { organizationId: null, bypassIsolation: true },
    fn
  );
}
