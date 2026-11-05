-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ChecklistStage" AS ENUM ('PRE_SERVICE', 'IN_SERVICE', 'POST_SERVICE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: service
ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "taskChecklistTemplate" JSONB;

-- AlterTable: staff_task
ALTER TABLE "staff_task" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "checklist_template" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "checklist_item_template" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" "ChecklistStage" NOT NULL DEFAULT 'PRE_SERVICE',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_item_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_task" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "stage" "ChecklistStage" NOT NULL DEFAULT 'PRE_SERVICE',
    "assignedToId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_checklist_item" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "taskId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" "ChecklistStage" NOT NULL DEFAULT 'PRE_SERVICE',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_checklist_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "checklist_template_organizationId_idx" ON "checklist_template"("organizationId");
CREATE INDEX IF NOT EXISTS "checklist_template_serviceId_idx" ON "checklist_template"("serviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "checklist_item_template_templateId_idx" ON "checklist_item_template"("templateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_task_organizationId_idx" ON "booking_task"("organizationId");
CREATE INDEX IF NOT EXISTS "booking_task_bookingId_idx" ON "booking_task"("bookingId");
CREATE INDEX IF NOT EXISTS "booking_task_assignedToId_idx" ON "booking_task"("assignedToId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_checklist_item_bookingId_idx" ON "booking_checklist_item"("bookingId");
CREATE INDEX IF NOT EXISTS "booking_checklist_item_taskId_idx" ON "booking_checklist_item"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "staff_task_bookingId_idx" ON "staff_task"("bookingId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "checklist_template" ADD CONSTRAINT "checklist_template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "checklist_template" ADD CONSTRAINT "checklist_template_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "checklist_item_template" ADD CONSTRAINT "checklist_item_template_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checklist_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "booking_task" ADD CONSTRAINT "booking_task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "booking_task" ADD CONSTRAINT "booking_task_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "booking_task" ADD CONSTRAINT "booking_task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "booking_checklist_item" ADD CONSTRAINT "booking_checklist_item_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "booking_checklist_item" ADD CONSTRAINT "booking_checklist_item_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "booking_task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "booking_checklist_item" ADD CONSTRAINT "booking_checklist_item_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "staff_task" ADD CONSTRAINT "staff_task_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;