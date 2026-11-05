-- AlterTable
ALTER TABLE "invoice_config" ADD COLUMN IF NOT EXISTS "autoGenerateInvoice" BOOLEAN NOT NULL DEFAULT true;
