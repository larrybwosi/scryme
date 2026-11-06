-- AlterTable
ALTER TABLE "report_settings" ADD COLUMN IF NOT EXISTS "formats" TEXT[] DEFAULT ARRAY['HTML', 'MARKDOWN']::TEXT[];
ALTER TABLE "report_settings" ADD COLUMN IF NOT EXISTS "defaultLocationId" TEXT;
ALTER TABLE "report_settings" ADD COLUMN IF NOT EXISTS "defaultDepartmentId" TEXT;
ALTER TABLE "report_settings" ADD COLUMN IF NOT EXISTS "minRevenueThreshold" DOUBLE PRECISION;
ALTER TABLE "report_settings" ADD COLUMN IF NOT EXISTS "summaryPeriodDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "report_settings" ADD COLUMN IF NOT EXISTS "workflowEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "report_settings" ADD COLUMN IF NOT EXISTS "workflowKey" TEXT;
ALTER TABLE "report_settings" ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT;
