-- Create Enum Types safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductionRunType') THEN
        CREATE TYPE "ProductionRunType" AS ENUM ('MAKE_TO_STOCK', 'ON_DEMAND');
    END IF;
END $$;

-- AlterTable Batch to add runType, orderReference, taskId
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "runType" "ProductionRunType" NOT NULL DEFAULT 'MAKE_TO_STOCK',
ADD COLUMN IF NOT EXISTS "orderReference" TEXT,
ADD COLUMN IF NOT EXISTS "taskId" TEXT;

-- Create Indexes
CREATE INDEX IF NOT EXISTS "Batch_taskId_idx" ON "Batch"("taskId");
CREATE INDEX IF NOT EXISTS "Batch_orderReference_idx" ON "Batch"("orderReference");
CREATE INDEX IF NOT EXISTS "Batch_runType_idx" ON "Batch"("runType");

-- Add ForeignKey Constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Batch_taskId_fkey') THEN
        ALTER TABLE "Batch" ADD CONSTRAINT "Batch_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
