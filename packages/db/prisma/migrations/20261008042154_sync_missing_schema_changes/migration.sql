/*
  Warnings:

  - The values [SCRYMECHAT,SYSTEM] on the enum `CommunicationChannel` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tiers` on the `LoyaltyProgram` table. All the data in the column will be lost.
  - You are about to drop the column `customRoles` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `roleGroups` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `customRoles` on the `organization` table. All the data in the column will be lost.
  - You are about to drop the column `roleGroups` on the `organization` table. All the data in the column will be lost.
  - You are about to drop the column `roleGroups` on the `permission_set` table. All the data in the column will be lost.
  - You are about to drop the `campaign_segment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `crm_field_definition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `crm_record` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `generated_stock_report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_automation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_automation_execution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_report_template` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[branchCode]` on the table `InventoryLocation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ShiftAttendanceStatus" AS ENUM ('ON_TIME', 'LATE', 'EARLY', 'UNSCHEDULED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AttendanceVerificationMethod" AS ENUM ('POS_DEVICE', 'GPS_GEOFENCE', 'QR_SCAN', 'MANAGER_OVERRIDE', 'WEB_PORTAL');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'ON_HOLD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProjectTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ProjectTaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "ProjectMemberRole" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('BLOCKS', 'BLOCKED_BY');

-- AlterEnum
BEGIN;
CREATE TYPE "CommunicationChannel_new" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'OTHER');
ALTER TABLE "public"."communication_threads" ALTER COLUMN "channel" DROP DEFAULT;
ALTER TABLE "communication_threads" ALTER COLUMN "channel" TYPE "CommunicationChannel_new" USING ("channel"::text::"CommunicationChannel_new");
ALTER TYPE "CommunicationChannel" RENAME TO "CommunicationChannel_old";
ALTER TYPE "CommunicationChannel_new" RENAME TO "CommunicationChannel";
DROP TYPE "public"."CommunicationChannel_old";
ALTER TABLE "communication_threads" ALTER COLUMN "channel" SET DEFAULT 'WHATSAPP';
COMMIT;

-- DropForeignKey
ALTER TABLE "campaign_segment" DROP CONSTRAINT IF EXISTS "campaign_segment_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "communication_threads" DROP CONSTRAINT IF EXISTS "communication_threads_crmRecordId_fkey";

-- DropForeignKey
ALTER TABLE "crm_field_definition" DROP CONSTRAINT IF EXISTS "crm_field_definition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "crm_record" DROP CONSTRAINT IF EXISTS "crm_record_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "generated_stock_report" DROP CONSTRAINT IF EXISTS "generated_stock_report_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "generated_stock_report" DROP CONSTRAINT IF EXISTS "generated_stock_report_templateId_fkey";

-- DropForeignKey
ALTER TABLE "report_automation" DROP CONSTRAINT IF EXISTS "report_automation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "report_automation" DROP CONSTRAINT IF EXISTS "report_automation_templateId_fkey";

-- DropForeignKey
ALTER TABLE "report_automation_execution" DROP CONSTRAINT IF EXISTS "report_automation_execution_automationId_fkey";

-- DropForeignKey
ALTER TABLE "stock_report_template" DROP CONSTRAINT IF EXISTS "stock_report_template_organizationId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "recipe_ingredient_recipeId_ingredientVariantId_systemUnitId_key";

-- AlterTable
ALTER TABLE "InventoryLocation" ADD COLUMN IF NOT EXISTS "branchCode" TEXT,
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "radiusMeters" INTEGER DEFAULT 100;

-- AlterTable
ALTER TABLE "LoyaltyProgram" DROP COLUMN "tiers";

-- AlterTable
ALTER TABLE "attendance_log" ADD COLUMN IF NOT EXISTS "distanceMeters" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "isLocationVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "shiftId" TEXT,
ADD COLUMN IF NOT EXISTS "shiftStatus" "ShiftAttendanceStatus" NOT NULL DEFAULT 'UNSCHEDULED',
ADD COLUMN IF NOT EXISTS "verificationMethod" "AttendanceVerificationMethod" NOT NULL DEFAULT 'POS_DEVICE';

-- AlterTable
ALTER TABLE "bakery_settings" ADD COLUMN IF NOT EXISTS "batchGenerationType" TEXT NOT NULL DEFAULT 'SEQUENCE';

-- AlterTable
ALTER TABLE "member" DROP COLUMN "customRoles",
DROP COLUMN "roleGroups";

-- AlterTable
ALTER TABLE "organization" DROP COLUMN "customRoles",
DROP COLUMN "roleGroups";

-- AlterTable
ALTER TABLE "permission_set" DROP COLUMN "roleGroups";

-- DropTable
DROP TABLE IF EXISTS "campaign_segment";

-- DropTable
DROP TABLE IF EXISTS "crm_field_definition";

-- DropTable
DROP TABLE IF EXISTS "crm_record";

-- DropTable
DROP TABLE IF EXISTS "generated_stock_report";

-- DropTable
DROP TABLE IF EXISTS "report_automation";

-- DropTable
DROP TABLE IF EXISTS "report_automation_execution";

-- DropTable
DROP TABLE IF EXISTS "stock_report_template";

-- CreateTable
CREATE TABLE IF NOT EXISTS "project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "ProjectTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_member" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" "ProjectMemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskNumber" INTEGER NOT NULL,
    "taskKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "ProjectTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "estimatedHours" DECIMAL(10,2),
    "actualHours" DECIMAL(10,2),
    "parentTaskId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_assignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_dependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,
    "type" "DependencyType" NOT NULL DEFAULT 'BLOCKS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_comment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_activity_log" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_label" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_label_on_task" (
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "task_label_on_task_pkey" PRIMARY KEY ("taskId","labelId")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "project_organizationId_idx" ON "project"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "project_status_idx" ON "project"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "project_organizationId_key_key" ON "project"("organizationId", "key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "project_member_memberId_idx" ON "project_member"("memberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "project_member_projectId_idx" ON "project_member"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "project_member_projectId_memberId_key" ON "project_member"("projectId", "memberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_organizationId_idx" ON "task"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_projectId_idx" ON "task"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_status_idx" ON "task"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_parentTaskId_idx" ON "task"("parentTaskId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "task_projectId_taskNumber_key" ON "task"("projectId", "taskNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_assignee_memberId_idx" ON "task_assignee"("memberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_assignee_taskId_idx" ON "task_assignee"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "task_assignee_taskId_memberId_key" ON "task_assignee"("taskId", "memberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_dependency_taskId_idx" ON "task_dependency"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_dependency_dependsOnTaskId_idx" ON "task_dependency"("dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "task_dependency_taskId_dependsOnTaskId_key" ON "task_dependency"("taskId", "dependsOnTaskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_comment_taskId_idx" ON "task_comment"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_comment_authorId_idx" ON "task_comment"("authorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_activity_log_taskId_idx" ON "task_activity_log"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_activity_log_actorId_idx" ON "task_activity_log"("actorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_label_organizationId_idx" ON "task_label"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_label_projectId_idx" ON "task_label"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "task_label_organizationId_projectId_name_key" ON "task_label"("organizationId", "projectId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_label_on_task_taskId_idx" ON "task_label_on_task"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_label_on_task_labelId_idx" ON "task_label_on_task"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryLocation_branchCode_key" ON "InventoryLocation"("branchCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_log_shiftId_idx" ON "attendance_log"("shiftId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_threads_crmRecordId_fkey') THEN
        ALTER TABLE "communication_threads" ADD CONSTRAINT "communication_threads_crmRecordId_fkey" FOREIGN KEY ("crmRecordId") REFERENCES "crm_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_log_shiftId_fkey') THEN
        ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "staff_shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_organizationId_fkey') THEN
        ALTER TABLE "project" ADD CONSTRAINT "project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_ownerId_fkey') THEN
        ALTER TABLE "project" ADD CONSTRAINT "project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_member_projectId_fkey') THEN
        ALTER TABLE "project_member" ADD CONSTRAINT "project_member_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_member_memberId_fkey') THEN
        ALTER TABLE "project_member" ADD CONSTRAINT "project_member_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_organizationId_fkey') THEN
        ALTER TABLE "task" ADD CONSTRAINT "task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_projectId_fkey') THEN
        ALTER TABLE "task" ADD CONSTRAINT "task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_parentTaskId_fkey') THEN
        ALTER TABLE "task" ADD CONSTRAINT "task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_createdById_fkey') THEN
        ALTER TABLE "task" ADD CONSTRAINT "task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_assignee_taskId_fkey') THEN
        ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_assignee_memberId_fkey') THEN
        ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependency_taskId_fkey') THEN
        ALTER TABLE "task_dependency" ADD CONSTRAINT "task_dependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependency_dependsOnTaskId_fkey') THEN
        ALTER TABLE "task_dependency" ADD CONSTRAINT "task_dependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_comment_taskId_fkey') THEN
        ALTER TABLE "task_comment" ADD CONSTRAINT "task_comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_comment_authorId_fkey') THEN
        ALTER TABLE "task_comment" ADD CONSTRAINT "task_comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_activity_log_taskId_fkey') THEN
        ALTER TABLE "task_activity_log" ADD CONSTRAINT "task_activity_log_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_activity_log_actorId_fkey') THEN
        ALTER TABLE "task_activity_log" ADD CONSTRAINT "task_activity_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_label_organizationId_fkey') THEN
        ALTER TABLE "task_label" ADD CONSTRAINT "task_label_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_label_projectId_fkey') THEN
        ALTER TABLE "task_label" ADD CONSTRAINT "task_label_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_label_on_task_taskId_fkey') THEN
        ALTER TABLE "task_label_on_task" ADD CONSTRAINT "task_label_on_task_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_label_on_task_labelId_fkey') THEN
        ALTER TABLE "task_label_on_task" ADD CONSTRAINT "task_label_on_task_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "task_label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- RenameIndex
ALTER INDEX "communication_threads_organizationId_channel_participantPhone_k" RENAME TO "communication_threads_organizationId_channel_participantPho_key";
