import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  project: ["create", "share", "update", "delete"],
  user: ["update"],
} as const;

export const ac = createAccessControl(statement);

export const CASHIER = ac.newRole({
  project: ["create"],
});

export const ADMIN = ac.newRole({
  project: ["create", "update", "share", "delete"],
});

export const DEVELOPER = ac.newRole({
  project: ["create", "update", "delete"],
  user: ["update"],
});
