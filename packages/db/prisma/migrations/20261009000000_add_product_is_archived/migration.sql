-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_organizationId_isArchived_idx" ON "Product"("organizationId", "isArchived");
