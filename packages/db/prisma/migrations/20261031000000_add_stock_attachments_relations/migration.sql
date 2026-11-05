-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "stockTransferId" TEXT;
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "stockAdjustmentId" TEXT;
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "stockReconciliationId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Attachment_stockTransferId_idx" ON "Attachment"("stockTransferId");
CREATE INDEX IF NOT EXISTS "Attachment_stockAdjustmentId_idx" ON "Attachment"("stockAdjustmentId");
CREATE INDEX IF NOT EXISTS "Attachment_stockReconciliationId_idx" ON "Attachment"("stockReconciliationId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_stockTransferId_fkey'
  ) THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "stock_transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_stockAdjustmentId_fkey'
  ) THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_stockAdjustmentId_fkey" FOREIGN KEY ("stockAdjustmentId") REFERENCES "StockAdjustment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_stockReconciliationId_fkey'
  ) THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_stockReconciliationId_fkey" FOREIGN KEY ("stockReconciliationId") REFERENCES "StockReconciliation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
