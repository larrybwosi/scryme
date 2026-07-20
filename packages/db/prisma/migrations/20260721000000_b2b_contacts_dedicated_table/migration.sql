-- Create table company_contacts
CREATE TABLE "company_contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "businessAccountId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints to company_contacts
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for company_contacts
CREATE INDEX "company_contacts_businessAccountId_idx" ON "company_contacts"("businessAccountId");
CREATE INDEX "company_contacts_organizationId_idx" ON "company_contacts"("organizationId");

-- Add businessAccountId column and fkey to Invoice
ALTER TABLE "Invoice" ADD COLUMN "businessAccountId" TEXT;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 1: Copy existing B2B contacts from Customer to company_contacts
INSERT INTO "company_contacts" ("id", "name", "email", "phone", "businessAccountId", "organizationId", "createdAt", "updatedAt")
SELECT "id", "name", "email", "phone", "businessAccountId", "organizationId", "createdAt", "updatedAt"
FROM "Customer"
WHERE "businessAccountId" IS NOT NULL;

-- Step 2: Populate businessAccountId on Invoice from associated B2B Customer
UPDATE "Invoice" i
SET "businessAccountId" = c."businessAccountId"
FROM "Customer" c
WHERE i."customerId" = c."id" AND c."businessAccountId" IS NOT NULL;

-- Step 3: Clear customerId on B2B invoices and transactions
UPDATE "Invoice"
SET "customerId" = NULL
WHERE "businessAccountId" IS NOT NULL;

UPDATE "transaction"
SET "customerId" = NULL
WHERE "businessAccountId" IS NOT NULL;

-- Step 4: Delete the copied B2B contacts from Customer table
DELETE FROM "Customer" WHERE "businessAccountId" IS NOT NULL;

-- Step 5: Drop legacy column and constraint on Customer
ALTER TABLE "Customer" DROP COLUMN "businessAccountId";
