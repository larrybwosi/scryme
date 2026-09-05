-- CreateEnum
CREATE TYPE "WorkflowTriggerType" AS ENUM ('EVENT', 'WEBHOOK', 'SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebhookDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "AuditLogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "workflow_engine_definition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "WorkflowTriggerType" NOT NULL DEFAULT 'EVENT',
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_engine_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_engine_execution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_engine_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_engine_job" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "handler" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WorkflowJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "backoffMs" INTEGER NOT NULL DEFAULT 1000,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_engine_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_engine_webhook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "definitionId" TEXT,
    "name" TEXT NOT NULL,
    "direction" "WebhookDirection" NOT NULL DEFAULT 'INCOMING',
    "endpointUrl" TEXT NOT NULL,
    "secret" TEXT,
    "headers" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_engine_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_engine_audit_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "executionId" TEXT,
    "jobId" TEXT,
    "action" TEXT NOT NULL,
    "level" "AuditLogLevel" NOT NULL DEFAULT 'INFO',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_engine_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_engine_definition_organizationId_isActive_idx" ON "workflow_engine_definition"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_engine_definition_organizationId_key_key" ON "workflow_engine_definition"("organizationId", "key");

-- CreateIndex
CREATE INDEX "workflow_engine_execution_organizationId_triggerEvent_idx" ON "workflow_engine_execution"("organizationId", "triggerEvent");

-- CreateIndex
CREATE INDEX "workflow_engine_execution_correlationId_idx" ON "workflow_engine_execution"("correlationId");

-- CreateIndex
CREATE INDEX "workflow_engine_execution_status_idx" ON "workflow_engine_execution"("status");

-- CreateIndex
CREATE INDEX "workflow_engine_job_organizationId_status_idx" ON "workflow_engine_job"("organizationId", "status");

-- CreateIndex
CREATE INDEX "workflow_engine_job_status_nextRunAt_idx" ON "workflow_engine_job"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "workflow_engine_job_executionId_idx" ON "workflow_engine_job"("executionId");

-- CreateIndex
CREATE INDEX "workflow_engine_webhook_organizationId_direction_idx" ON "workflow_engine_webhook"("organizationId", "direction");

-- CreateIndex
CREATE INDEX "workflow_engine_audit_log_organizationId_action_idx" ON "workflow_engine_audit_log"("organizationId", "action");

-- CreateIndex
CREATE INDEX "workflow_engine_audit_log_executionId_idx" ON "workflow_engine_audit_log"("executionId");

-- CreateIndex
CREATE INDEX "workflow_engine_audit_log_jobId_idx" ON "workflow_engine_audit_log"("jobId");

-- AddForeignKey
ALTER TABLE "workflow_engine_definition" ADD CONSTRAINT "workflow_engine_definition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_execution" ADD CONSTRAINT "workflow_engine_execution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_execution" ADD CONSTRAINT "workflow_engine_execution_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_engine_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_job" ADD CONSTRAINT "workflow_engine_job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_job" ADD CONSTRAINT "workflow_engine_job_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "workflow_engine_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_job" ADD CONSTRAINT "workflow_engine_job_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_engine_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_webhook" ADD CONSTRAINT "workflow_engine_webhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_webhook" ADD CONSTRAINT "workflow_engine_webhook_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_engine_definition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_audit_log" ADD CONSTRAINT "workflow_engine_audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_audit_log" ADD CONSTRAINT "workflow_engine_audit_log_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "workflow_engine_execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_engine_audit_log" ADD CONSTRAINT "workflow_engine_audit_log_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "workflow_engine_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
