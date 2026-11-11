import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt, bearer } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import { db, UserRole } from "@repo/db";
import { env } from "@repo/env";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTwoFactorOTPEmail,
} from "@repo/shared/services/email";

export const authOptions: BetterAuthOptions = {
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url, token }) {
      try {
        const defaultAuthUrl = env.NODE_ENV === "production" ? "https://auth.scryme.tech" : "http://localhost:4444";
        const authOrigin = (env.NEXT_PUBLIC_AUTH_URL || defaultAuthUrl).replace(/\/+$/, "");
        let callbackURL = "";
        if (url) {
          try {
            const parsed = new URL(url);
            callbackURL = parsed.searchParams.get("callbackURL") || "";
          } catch {
            // Ignore URL parse error
          }
        }
        const callbackQuery = callbackURL ? `&callbackURL=${encodeURIComponent(callbackURL)}` : "";
        const verifyUrl = `${authOrigin}/verify-email?token=${token}${callbackQuery}`;

        await sendVerificationEmail({
          email: user.email,
          url: verifyUrl,
          user: { name: user.name },
        });
      } catch (error) {
        console.error("Error sending verification email:", error);
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url, token }) {
      try {
        const defaultAuthUrl = env.NODE_ENV === "production" ? "https://auth.scryme.tech" : "http://localhost:4444";
        const authOrigin = (env.NEXT_PUBLIC_AUTH_URL || defaultAuthUrl).replace(/\/+$/, "");
        let callbackURL = "";
        if (url) {
          try {
            const parsedUrl = new URL(url);
            const callbackParam = parsedUrl.searchParams.get("callbackURL");
            if (callbackParam) {
              callbackURL = decodeURIComponent(callbackParam);
            }
          } catch (e) {
            // Ignore URL parse error
          }
        }
        const callbackQuery = callbackURL ? `&callbackURL=${encodeURIComponent(callbackURL)}` : "";
        const resetUrl = `${authOrigin}/reset-password?token=${token}${callbackQuery}`;

        await sendPasswordResetEmail({
          email: user.email,
          url: resetUrl,
          user: { name: user.name },
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
  plugins: [
    jwt(),
    bearer(),
    passkey({
      rpID: "auth.scryme.tech",
      rpName: "Scryme",
      origin: "https://auth.scryme.tech",
    }),
    twoFactor({
      issuer: "Scryme",
      otpOptions: {
        async sendOTP({ user, otp }) {
          try {
            await sendTwoFactorOTPEmail({
              email: user.email,
              otp,
              user: { name: user.name },
            });
          } catch (error) {
            console.error("Error sending 2FA OTP email:", error);
          }
        },
      },
    }),
  ],
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

// Export Standalone V3 Auth Helpers
export * from "./v3";
