-- AlterTable fulfillment
ALTER TABLE "fulfillment" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "fulfillment" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;
ALTER TABLE "fulfillment" ADD COLUMN IF NOT EXISTS "reconciliationNotes" TEXT;
ALTER TABLE "fulfillment" ADD COLUMN IF NOT EXISTS "codAmountCollected" DECIMAL(12, 2);

-- AlterTable fulfillment_item
ALTER TABLE "fulfillment_item" ADD COLUMN IF NOT EXISTS "quantityReturned" INTEGER DEFAULT 0;
ALTER TABLE "fulfillment_item" ADD COLUMN IF NOT EXISTS "quantityDamaged" INTEGER DEFAULT 0;
