-- Customermates two way integration: record versions, event dedupe and definition seed

-- CreateTable
CREATE TABLE "customermates_record_state" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "organizationIntegrationId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "externalVersion" TEXT,
    "lastChangedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "processingState" TEXT NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customermates_record_state_pkey" PRIMARY KEY ("id")
);

-- AlterTable: keep provider event ids as a dedupe ledger after payload cleanup
ALTER TABLE "integration_event" ADD COLUMN "externalEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customermates_record_state_organizationIntegrationId_typeId_recordId_key" ON "customermates_record_state"("organizationIntegrationId", "typeId", "recordId");

-- CreateIndex
CREATE INDEX "customermates_record_state_organizationId_processingState_idx" ON "customermates_record_state"("organizationId", "processingState");

-- CreateIndex
CREATE UNIQUE INDEX "integration_event_organizationIntegrationId_externalEventId_key" ON "integration_event"("organizationIntegrationId", "externalEventId");

-- AddForeignKey
ALTER TABLE "customermates_record_state" ADD CONSTRAINT "customermates_record_state_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customermates_record_state" ADD CONSTRAINT "customermates_record_state_organizationIntegrationId_fkey" FOREIGN KEY ("organizationIntegrationId") REFERENCES "organization_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the integration definition
INSERT INTO "integration_definition" ("id", "name", "slug", "description", "category", "authType", "isActive", "createdAt", "updatedAt")
VALUES (
    'cm_def_customermates',
    'Customermates',
    'customermates',
    'Two way sync of contacts, organizations, deals and messages with Customermates',
    'CRM',
    'API_KEY',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;
