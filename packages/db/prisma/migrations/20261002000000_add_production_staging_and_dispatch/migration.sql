-- Create Enum Types safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BatchStagingStatus') THEN
        CREATE TYPE "BatchStagingStatus" AS ENUM ('NOT_STAGED', 'STAGED', 'PARTIALLY_DISPATCHED', 'FULLY_DISPATCHED', 'DISPOSED');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "bakery_settings" ADD COLUMN IF NOT EXISTS "enableProductionStaging" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "stagedQuantity" DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS "dispatchedQuantity" DECIMAL(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "stagingWasteQuantity" DECIMAL(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "stagingStatus" "BatchStagingStatus" DEFAULT 'NOT_STAGED';

-- CreateTable
CREATE TABLE IF NOT EXISTS "batch_dispatch" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "dispatchedById" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "batch_dispatch_batchId_idx" ON "batch_dispatch"("batchId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "batch_dispatch_toLocationId_idx" ON "batch_dispatch"("toLocationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "batch_dispatch_organizationId_idx" ON "batch_dispatch"("organizationId");

-- AddForeignKey Constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batch_dispatch_batchId_fkey') THEN
        ALTER TABLE "batch_dispatch" ADD CONSTRAINT "batch_dispatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batch_dispatch_toLocationId_fkey') THEN
        ALTER TABLE "batch_dispatch" ADD CONSTRAINT "batch_dispatch_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batch_dispatch_dispatchedById_fkey') THEN
        ALTER TABLE "batch_dispatch" ADD CONSTRAINT "batch_dispatch_dispatchedById_fkey" FOREIGN KEY ("dispatchedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batch_dispatch_organizationId_fkey') THEN
        ALTER TABLE "batch_dispatch" ADD CONSTRAINT "batch_dispatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
