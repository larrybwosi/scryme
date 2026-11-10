-- AlterTable: task
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_bookingId_idx" ON "task"("bookingId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_bookingId_fkey') THEN
        ALTER TABLE "task" ADD CONSTRAINT "task_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
