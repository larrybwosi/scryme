-- AlterTable
ALTER TABLE "organization"
  ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "suspendedAt" TIMESTAMP(3),
  ADD COLUMN "suspensionReason" TEXT,
  ADD COLUMN "quotaOverrides" JSONB;
