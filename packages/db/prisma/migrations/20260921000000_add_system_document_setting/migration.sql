-- CreateTable
CREATE TABLE "system_document_setting" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "templateId" TEXT NOT NULL DEFAULT '',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_document_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_document_setting_documentType_idx" ON "system_document_setting"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "system_document_setting_documentType_templateId_key" ON "system_document_setting"("documentType", "templateId");
