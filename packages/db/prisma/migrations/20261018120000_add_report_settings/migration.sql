-- CreateTable
CREATE TABLE IF NOT EXISTS "report_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scrymeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scrymeChannel" TEXT NOT NULL DEFAULT 'reports',
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
    "timeOfDay" TEXT NOT NULL DEFAULT '08:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "includeSales" BOOLEAN NOT NULL DEFAULT true,
    "includeInventory" BOOLEAN NOT NULL DEFAULT true,
    "includeProduction" BOOLEAN NOT NULL DEFAULT true,
    "includeTax" BOOLEAN NOT NULL DEFAULT true,
    "includeAiInsights" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "report_settings_organizationId_key" ON "report_settings"("organizationId");

-- AddForeignKey
ALTER TABLE "report_settings" ADD CONSTRAINT "report_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
