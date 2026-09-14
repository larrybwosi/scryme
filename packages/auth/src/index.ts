import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt, bearer } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import type { BetterAuthOptions } from "better-auth";
import { db, UserRole } from "@repo/db";
import { env } from "@repo/env";

export const authOptions: BetterAuthOptions = {
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url, token }) {
      try {
        const { sendEmail } = await import("@repo/shared/services/notification");
        const resetUrl = url || `https://app.scryme.tech/reset-password?token=${token}`;
        await sendEmail({
          to: user.email,
          subject: "Reset your Scryme password",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
              <div style="margin-bottom: 24px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #0F1B2E; margin: 0 0 8px 0;">Reset your password</h2>
                <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 0;">Hi ${user.name || "there"},</p>
              </div>
              <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin-bottom: 24px;">
                We received a request to reset the password for your Scryme account. Click the button below to set a new password:
              </p>
              <div style="margin-bottom: 24px;">
                <a href="${resetUrl}" style="background-color: #0F1B2E; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin-bottom: 12px;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <p style="font-size: 12px; color: #9CA3AF; word-break: break-all;">
                Or copy and paste this link into your browser:<br />
                <a href="${resetUrl}" style="color: #2563EB;">${resetUrl}</a>
              </p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Error sending reset password email:", error);
      }
    },
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
  plugins: [jwt(), bearer(), passkey()],
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
