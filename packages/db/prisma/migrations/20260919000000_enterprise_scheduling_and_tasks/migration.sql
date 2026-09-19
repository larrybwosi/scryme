-- CreateEnum
CREATE TYPE "ShiftTradeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "staff_shift" ADD COLUMN "departmentId" TEXT, ADD COLUMN "roleTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "shift_trade_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requesterMemberId" TEXT NOT NULL,
    "targetMemberId" TEXT,
    "shiftId" TEXT NOT NULL,
    "offeredShiftId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SWAP',
    "status" "ShiftTradeStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_trade_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_task" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "memberId" TEXT,
    "shiftId" TEXT,
    "locationId" TEXT,
    "checklist" JSONB,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_trade_request_organizationId_status_idx" ON "shift_trade_request"("organizationId", "status");

-- CreateIndex
CREATE INDEX "shift_trade_request_requesterMemberId_idx" ON "shift_trade_request"("requesterMemberId");

-- CreateIndex
CREATE INDEX "shift_trade_request_targetMemberId_idx" ON "shift_trade_request"("targetMemberId");

-- CreateIndex
CREATE INDEX "staff_task_organizationId_status_idx" ON "staff_task"("organizationId", "status");

-- CreateIndex
CREATE INDEX "staff_task_memberId_status_idx" ON "staff_task"("memberId", "status");

-- CreateIndex
CREATE INDEX "staff_task_shiftId_idx" ON "staff_task"("shiftId");

-- AddForeignKey
ALTER TABLE "shift_trade_request" ADD CONSTRAINT "shift_trade_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_trade_request" ADD CONSTRAINT "shift_trade_request_requesterMemberId_fkey" FOREIGN KEY ("requesterMemberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_trade_request" ADD CONSTRAINT "shift_trade_request_targetMemberId_fkey" FOREIGN KEY ("targetMemberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_trade_request" ADD CONSTRAINT "shift_trade_request_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "staff_shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_trade_request" ADD CONSTRAINT "shift_trade_request_offeredShiftId_fkey" FOREIGN KEY ("offeredShiftId") REFERENCES "staff_shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_task" ADD CONSTRAINT "staff_task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_task" ADD CONSTRAINT "staff_task_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_task" ADD CONSTRAINT "staff_task_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "staff_shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_task" ADD CONSTRAINT "staff_task_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "inventory_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
