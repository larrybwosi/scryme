-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MilestoneStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "milestoneId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_milestone" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_time_entry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_time_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "project_milestone_organizationId_idx" ON "project_milestone"("organizationId");
CREATE INDEX IF NOT EXISTS "project_milestone_projectId_idx" ON "project_milestone"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_time_entry_organizationId_idx" ON "task_time_entry"("organizationId");
CREATE INDEX IF NOT EXISTS "task_time_entry_taskId_idx" ON "task_time_entry"("taskId");
CREATE INDEX IF NOT EXISTS "task_time_entry_memberId_idx" ON "task_time_entry"("memberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_milestoneId_idx" ON "task"("milestoneId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestone_organizationId_fkey') THEN
        ALTER TABLE "project_milestone" ADD CONSTRAINT "project_milestone_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestone_projectId_fkey') THEN
        ALTER TABLE "project_milestone" ADD CONSTRAINT "project_milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_milestoneId_fkey') THEN
        ALTER TABLE "task" ADD CONSTRAINT "task_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "project_milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_time_entry_organizationId_fkey') THEN
        ALTER TABLE "task_time_entry" ADD CONSTRAINT "task_time_entry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_time_entry_taskId_fkey') THEN
        ALTER TABLE "task_time_entry" ADD CONSTRAINT "task_time_entry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_time_entry_memberId_fkey') THEN
        ALTER TABLE "task_time_entry" ADD CONSTRAINT "task_time_entry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
