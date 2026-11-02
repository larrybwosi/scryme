-- Create production_categories if not exists
CREATE TABLE IF NOT EXISTS "production_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_categories_pkey" PRIMARY KEY ("id")
);

-- Copy data from bakery_category to production_categories if bakery_category exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bakery_category') THEN
        INSERT INTO "production_categories" ("id", "name", "description", "organizationId", "createdAt", "updatedAt")
        SELECT "id", "name", "description", "organizationId", "createdAt", "updatedAt"
        FROM "bakery_category"
        ON CONFLICT ("id") DO NOTHING;
    END IF;
END $$;

-- Create production_settings if not exists
CREATE TABLE IF NOT EXISTS "production_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultOperatorId" TEXT,
    "autoCreateDailyBatches" BOOLEAN NOT NULL DEFAULT false,
    "expiryWarningDays" INTEGER NOT NULL DEFAULT 3,
    "authMode" "BakeryAuthMode" NOT NULL DEFAULT 'CARD_PIN',
    "batchPrefix" TEXT NOT NULL DEFAULT 'BAT',
    "batchSeparator" TEXT NOT NULL DEFAULT '-',
    "batchDateFormat" TEXT NOT NULL DEFAULT 'YYYYMMDD',
    "batchSequence" TEXT NOT NULL DEFAULT '4',
    "batchGenerationType" TEXT NOT NULL DEFAULT 'SEQUENCE',
    "enableProductionStaging" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveBatches" BOOLEAN NOT NULL DEFAULT false,
    "lowStockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "scrymeReportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scrymeReportDay" INTEGER NOT NULL DEFAULT 1,
    "scrymeReportTime" TEXT NOT NULL DEFAULT '08:00',
    "scrymeReportSections" JSONB,
    "scrymeReportChannel" TEXT DEFAULT 'production-reports',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_settings_pkey" PRIMARY KEY ("id")
);

-- Copy data from bakery_settings to production_settings
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bakery_settings') THEN
        INSERT INTO "production_settings" (
            "id", "organizationId", "defaultOperatorId", "autoCreateDailyBatches",
            "expiryWarningDays", "authMode", "batchPrefix", "batchSeparator",
            "batchDateFormat", "batchSequence", "batchGenerationType",
            "enableProductionStaging", "autoApproveBatches", "lowStockAlerts",
            "timezone", "scrymeReportEnabled", "scrymeReportDay", "scrymeReportTime",
            "scrymeReportSections", "scrymeReportChannel", "createdAt", "updatedAt"
        )
        SELECT
            "id", "organizationId", "defaultBakerId", "autoCreateDailyBatches",
            "expiryWarningDays", "authMode", "batchPrefix", "batchSeparator",
            "batchDateFormat", "batchSequence", "batchGenerationType",
            "enableProductionStaging", "autoApproveBatches", "lowStockAlerts",
            "timezone", "scrymeReportEnabled", "scrymeReportDay", "scrymeReportTime",
            "scrymeReportSections", "scrymeReportChannel", "createdAt", "updatedAt"
        FROM "bakery_settings"
        ON CONFLICT ("id") DO NOTHING;
    END IF;
END $$;

-- Create production_operators if not exists
CREATE TABLE IF NOT EXISTS "production_operators" (
    "id" TEXT NOT NULL,
    "productionSettingsId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "specialties" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_operators_pkey" PRIMARY KEY ("id")
);

-- Copy data from bakery_bakers to production_operators
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bakery_bakers') THEN
        INSERT INTO "production_operators" (
            "id", "productionSettingsId", "memberId", "specialties", "isActive", "createdAt", "updatedAt"
        )
        SELECT
            "id", "bakerySettingsId", "memberId", "specialties", "isActive", "createdAt", "updatedAt"
        FROM "bakery_bakers"
        ON CONFLICT ("id") DO NOTHING;
    END IF;
END $$;

-- Create indexes and constraints on production_categories
CREATE UNIQUE INDEX IF NOT EXISTS "production_categories_organizationId_name_key" ON "production_categories"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "production_categories_organizationId_idx" ON "production_categories"("organizationId");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_categories_organizationId_fkey') THEN
        ALTER TABLE "production_categories" ADD CONSTRAINT "production_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes and constraints on production_settings
CREATE UNIQUE INDEX IF NOT EXISTS "production_settings_organizationId_key" ON "production_settings"("organizationId");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_settings_organizationId_fkey') THEN
        ALTER TABLE "production_settings" ADD CONSTRAINT "production_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes and constraints on production_operators
CREATE UNIQUE INDEX IF NOT EXISTS "production_operators_productionSettingsId_memberId_key" ON "production_operators"("productionSettingsId", "memberId");
CREATE INDEX IF NOT EXISTS "production_operators_productionSettingsId_idx" ON "production_operators"("productionSettingsId");
CREATE INDEX IF NOT EXISTS "production_operators_memberId_idx" ON "production_operators"("memberId");
CREATE INDEX IF NOT EXISTS "production_operators_isActive_idx" ON "production_operators"("isActive");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_operators_productionSettingsId_fkey') THEN
        ALTER TABLE "production_operators" ADD CONSTRAINT "production_operators_productionSettingsId_fkey" FOREIGN KEY ("productionSettingsId") REFERENCES "production_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_operators_memberId_fkey') THEN
        ALTER TABLE "production_operators" ADD CONSTRAINT "production_operators_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_settings_defaultOperatorId_fkey') THEN
        ALTER TABLE "production_settings" ADD CONSTRAINT "production_settings_defaultOperatorId_fkey" FOREIGN KEY ("defaultOperatorId") REFERENCES "production_operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add new columns to Recipe and Batch safely
ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "productionCategoryId" TEXT;
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "leadOperatorId" TEXT;
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "canceledByOperatorId" TEXT;
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "disposedByOperatorId" TEXT;
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "leadOperatorId" TEXT;

-- Foreign key constraints for new columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Recipe_productionCategoryId_fkey') THEN
        ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_productionCategoryId_fkey" FOREIGN KEY ("productionCategoryId") REFERENCES "production_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Batch_leadOperatorId_fkey') THEN
        ALTER TABLE "Batch" ADD CONSTRAINT "Batch_leadOperatorId_fkey" FOREIGN KEY ("leadOperatorId") REFERENCES "production_operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Batch_canceledByOperatorId_fkey') THEN
        ALTER TABLE "Batch" ADD CONSTRAINT "Batch_canceledByOperatorId_fkey" FOREIGN KEY ("canceledByOperatorId") REFERENCES "production_operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Batch_disposedByOperatorId_fkey') THEN
        ALTER TABLE "Batch" ADD CONSTRAINT "Batch_disposedByOperatorId_fkey" FOREIGN KEY ("disposedByOperatorId") REFERENCES "production_operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Template_leadOperatorId_fkey') THEN
        ALTER TABLE "Template" ADD CONSTRAINT "Template_leadOperatorId_fkey" FOREIGN KEY ("leadOperatorId") REFERENCES "production_operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Backfill new columns with existing relationships
UPDATE "Recipe" SET "productionCategoryId" = "categoryId" WHERE "productionCategoryId" IS NULL;
UPDATE "Batch" SET "leadOperatorId" = "leadBakerId" WHERE "leadOperatorId" IS NULL;
UPDATE "Batch" SET "canceledByOperatorId" = "canceledById" WHERE "canceledByOperatorId" IS NULL;
UPDATE "Batch" SET "disposedByOperatorId" = "disposedById" WHERE "disposedByOperatorId" IS NULL;
UPDATE "Template" SET "leadOperatorId" = "leadBakerId" WHERE "leadOperatorId" IS NULL;
