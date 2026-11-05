-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN "defaultDeliveryNoteTemplate" TEXT NOT NULL DEFAULT 'delivery-note-v3';

-- CreateTable
CREATE TABLE "delivery_note_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_note_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_note_config_organizationId_key" ON "delivery_note_config"("organizationId");

-- CreateIndex
CREATE INDEX "delivery_note_config_organizationId_idx" ON "delivery_note_config"("organizationId");

-- AddForeignKey
ALTER TABLE "delivery_note_config" ADD CONSTRAINT "delivery_note_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
