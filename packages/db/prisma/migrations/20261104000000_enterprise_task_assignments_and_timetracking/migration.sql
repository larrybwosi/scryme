-- AlterTable
ALTER TABLE "task_assignee" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "task_assignee" ADD COLUMN IF NOT EXISTS "allocatedHours" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "task_time_entry" ALTER COLUMN "taskId" DROP NOT NULL;
ALTER TABLE "task_time_entry" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "task_time_entry" ADD COLUMN IF NOT EXISTS "isBillable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "task_time_entry" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;
