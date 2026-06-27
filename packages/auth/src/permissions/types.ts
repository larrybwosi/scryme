export type PermissionAction =
  | "create"
  | "view"
  | "edit"
  | "delete"
  | "manage"
  | "approve"
  | "submit"
  | "generate"
  | "view:own"
  | "manage:own"
  | "create:own"
  | "*";

export interface Permission {
  resource: string;
  action: PermissionAction | string;
  scope?: string | null;
}
