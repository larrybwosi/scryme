import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@repo/db";
export const authOptions = {
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
// Export Approvals (explicitly export everything except WorkflowResult which is duplicated in validations)
export { createApprovalWorkflow, updateApprovalWorkflowInfo, setActiveWorkflow, getWorkflowDetails } from "./approvals";
