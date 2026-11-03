-- CreateEnum
CREATE TYPE "KRAProvider" AS ENUM ('NAVARI', 'DIRECT_ETIMS');
CREATE TYPE "KRAEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');
CREATE TYPE "KRAEnforcementMode" AS ENUM ('BLOCKING', 'ASYNC');

-- CreateTable kra_config
CREATE TABLE IF NOT EXISTS "kra_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "KRAProvider" NOT NULL DEFAULT 'NAVARI',
    "environment" "KRAEnvironment" NOT NULL DEFAULT 'SANDBOX',
    "enforcementMode" "KRAEnforcementMode" NOT NULL DEFAULT 'ASYNC',
    "kraPin" TEXT NOT NULL,
    "businessName" TEXT,
    "branchCode" TEXT NOT NULL DEFAULT '00',
    "deviceSerialNumber" TEXT,
    "controlUnitId" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "highValueThreshold" DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
    "autoSyncSales" BOOLEAN NOT NULL DEFAULT true,
    "autoSyncPurchases" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kra_config_pkey" PRIMARY KEY ("id")
);

-- AlterTable invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "kraControlCode" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "kraReceiptNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "kraQrCode" TEXT;

-- AlterTable transaction
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "kraControlCode" TEXT;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "kraReceiptNumber" TEXT;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "kraQrCode" TEXT;

-- AlterTable KRAComplianceLog or kra_compliance_log
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'KRAComplianceLog') THEN
        ALTER TABLE "KRAComplianceLog" RENAME TO "kra_compliance_log";
    END IF;
END $$;

ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "transactionId" TEXT;
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "purchaseId" TEXT;
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'NAVARI';
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "controlCode" TEXT;
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "qrCodeUrl" TEXT;
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "errorCode" TEXT;
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "kra_compliance_log" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "kra_config_organizationId_key" ON "kra_config"("organizationId");
CREATE INDEX IF NOT EXISTS "kra_config_organizationId_idx" ON "kra_config"("organizationId");
CREATE INDEX IF NOT EXISTS "kra_compliance_log_transactionId_idx" ON "kra_compliance_log"("transactionId");
CREATE INDEX IF NOT EXISTS "kra_compliance_log_status_idx" ON "kra_compliance_log"("status");

-- AddForeignKey
ALTER TABLE "kra_config" ADD CONSTRAINT "kra_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
