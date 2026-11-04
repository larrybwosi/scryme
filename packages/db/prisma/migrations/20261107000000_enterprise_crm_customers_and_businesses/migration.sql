-- AlterTable Customer
ALTER TABLE "Customer" ADD COLUMN "accountManagerId" TEXT,
ADD COLUMN "lifecycleStage" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "lifetimeValue" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "creditLimit" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "creditHold" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable business_account
ALTER TABLE "business_account" ADD COLUMN "parentAccountId" TEXT,
ADD COLUMN "creditLimit" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "creditHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "accountManagerId" TEXT,
ADD COLUMN "lifecycleStage" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "industry" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "employeeCount" INTEGER,
ADD COLUMN "annualRevenue" DOUBLE PRECISION,
ADD COLUMN "contractStartDate" TIMESTAMP(3),
ADD COLUMN "contractEndDate" TIMESTAMP(3),
ADD COLUMN "contractStatus" TEXT DEFAULT 'ACTIVE',
ADD COLUMN "slaTier" TEXT DEFAULT 'STANDARD';

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_account" ADD CONSTRAINT "business_account_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "business_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_account" ADD CONSTRAINT "business_account_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
