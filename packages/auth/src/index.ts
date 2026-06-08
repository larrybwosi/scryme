import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@repo/db";
import { env } from "@repo/env";
import { admin } from "better-auth/plugins";

export const authOptions = {
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  plugins: [admin()],
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID || "default",
      clientSecret: env.GITHUB_CLIENT_SECRET || "default",
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "default",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "default",
    },
  },
};
// Export Permissions
export * from "./permissions/constants";
export * from "./permissions/definitions";
export * from "./permissions/types";
// Export Roles
export * from "./roles/predefined-roles";
export * from "./roles/templates";
// Export Validations
export * from "./validations/approval";
// Export Logic
export * from "./logic/permissions";
export * from "./logic/check-permission";
export * from "./logic/has-member-permission";
// Export Approvals
export {
  createApprovalWorkflow,
  updateApprovalWorkflowInfo,
  setActiveWorkflow,
  getWorkflowDetails,
} from "./approvals";
