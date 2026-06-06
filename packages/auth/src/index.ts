import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@repo/db";
import { env } from "@repo/env";

// Validate required environment variables
if (!env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required for authentication");
}

// Configure social providers only if credentials are provided
const socialProviders = {
  ...(env.GITHUB_CLIENT_ID &&
    env.GITHUB_CLIENT_SECRET && {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    }),
  ...(env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    }),
};

export const authOptions = {
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
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
