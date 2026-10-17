-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "is_custom_price" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "custom_monthly_price" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "custom_yearly_price" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "billing_interval" TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS "custom_currency" TEXT,
ADD COLUMN IF NOT EXISTS "custom_discount_percent" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "custom_tax_percent" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "custom_notes" TEXT;
