-- CreateEnum
CREATE TYPE "McpDraftStatus" AS ENUM ('DRAFT', 'APPLIED', 'REVERTED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "McpDraftEntityType" AS ENUM ('PRODUCT', 'PRICE', 'ORDER', 'FULFILLMENT', 'STAFF_TASK');

-- CreateEnum
CREATE TYPE "McpDraftAction" AS ENUM ('CREATE', 'UPDATE', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "mcp_draft_change" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" "McpDraftEntityType" NOT NULL,
    "action" "McpDraftAction" NOT NULL,
    "status" "McpDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "previousState" JSONB,
    "diffSummary" JSONB,
    "createdById" TEXT,
    "appliedAt" TIMESTAMP(3),
    "revertedAt" TIMESTAMP(3),
    "discardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_draft_change_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mcp_draft_change_organizationId_status_idx" ON "mcp_draft_change"("organizationId", "status");

-- CreateIndex
CREATE INDEX "mcp_draft_change_organizationId_entityType_idx" ON "mcp_draft_change"("organizationId", "entityType");

-- AddForeignKey
ALTER TABLE "mcp_draft_change" ADD CONSTRAINT "mcp_draft_change_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_draft_change" ADD CONSTRAINT "mcp_draft_change_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
