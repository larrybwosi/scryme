-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ProjectDocumentType" AS ENUM ('RFC', 'SPEC', 'PLAN', 'GUIDE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ProjectDocumentStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "sprintId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_sprint" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "scopePoints" INTEGER NOT NULL DEFAULT 0,
    "completedPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ProjectDocumentType" NOT NULL DEFAULT 'RFC',
    "status" "ProjectDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "content" TEXT,
    "summary" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "project_sprint_organizationId_idx" ON "project_sprint"("organizationId");
CREATE INDEX IF NOT EXISTS "project_sprint_projectId_idx" ON "project_sprint"("projectId");
CREATE INDEX IF NOT EXISTS "project_sprint_status_idx" ON "project_sprint"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "project_document_organizationId_idx" ON "project_document"("organizationId");
CREATE INDEX IF NOT EXISTS "project_document_projectId_idx" ON "project_document"("projectId");
CREATE INDEX IF NOT EXISTS "project_document_status_idx" ON "project_document"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "task_sprintId_idx" ON "task"("sprintId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_sprint_organizationId_fkey') THEN
        ALTER TABLE "project_sprint" ADD CONSTRAINT "project_sprint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_sprint_projectId_fkey') THEN
        ALTER TABLE "project_sprint" ADD CONSTRAINT "project_sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_sprintId_fkey') THEN
        ALTER TABLE "task" ADD CONSTRAINT "task_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "project_sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_document_organizationId_fkey') THEN
        ALTER TABLE "project_document" ADD CONSTRAINT "project_document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_document_projectId_fkey') THEN
        ALTER TABLE "project_document" ADD CONSTRAINT "project_document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_document_authorId_fkey') THEN
        ALTER TABLE "project_document" ADD CONSTRAINT "project_document_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
