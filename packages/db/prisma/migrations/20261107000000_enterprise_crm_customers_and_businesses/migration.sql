-- AlterTable Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "accountManagerId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lifecycleStage" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lifetimeValue" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "creditLimit" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "creditHold" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable business_account
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "parentAccountId" TEXT;
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "creditLimit" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "creditHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "accountManagerId" TEXT;
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "lifecycleStage" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "employeeCount" INTEGER;
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "annualRevenue" DOUBLE PRECISION;
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "contractStartDate" TIMESTAMP(3);
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3);
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "contractStatus" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "business_account" ADD COLUMN IF NOT EXISTS "slaTier" TEXT DEFAULT 'STANDARD';

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Customer_accountManagerId_fkey') THEN
        ALTER TABLE "Customer" ADD CONSTRAINT "Customer_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_account_parentAccountId_fkey') THEN
        ALTER TABLE "business_account" ADD CONSTRAINT "business_account_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "business_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_account_accountManagerId_fkey') THEN
        ALTER TABLE "business_account" ADD CONSTRAINT "business_account_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
