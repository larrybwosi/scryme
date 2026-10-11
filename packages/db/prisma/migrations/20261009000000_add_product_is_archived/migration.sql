-- AlterTable
ALTER TABLE "Product" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_organizationId_isArchived_idx" ON "Product"("organizationId", "isArchived");
