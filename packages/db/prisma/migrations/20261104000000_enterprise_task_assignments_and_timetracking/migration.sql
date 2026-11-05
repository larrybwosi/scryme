-- AlterTable
ALTER TABLE "task_assignee" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "task_assignee" ADD COLUMN "allocatedHours" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "task_time_entry" ALTER COLUMN "taskId" DROP NOT NULL;
ALTER TABLE "task_time_entry" ADD COLUMN "category" TEXT;
ALTER TABLE "task_time_entry" ADD COLUMN "isBillable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "task_time_entry" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;
