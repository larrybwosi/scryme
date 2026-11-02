-- AlterTable
ALTER TABLE "inventory_allocation" ADD COLUMN IF NOT EXISTS "quantityDamaged" INTEGER DEFAULT 0;
ALTER TABLE "inventory_allocation" ADD COLUMN IF NOT EXISTS "quantityReturned" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "return_item" ADD COLUMN IF NOT EXISTS "quantityDamaged" INTEGER DEFAULT 0;
ALTER TABLE "return_item" ADD COLUMN IF NOT EXISTS "quantityReturned" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "applicationType" TEXT;
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "scopes" TEXT[];
ALTER TABLE "oauth_client" ALTER COLUMN "tokenEndpointAuthMethod" DROP DEFAULT;
ALTER TABLE "oauth_client" ALTER COLUMN "skipConsent" DROP DEFAULT;
ALTER TABLE "oauth_client" ALTER COLUMN "enableEndSession" DROP DEFAULT;

-- AlterTable
ALTER TABLE "production_categories" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "production_operators" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "production_settings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "_AssistantOperatorBatches" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssistantOperatorBatches_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_TemplateAssistantOperators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TemplateAssistantOperators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_AssistantOperatorBatches_B_index" ON "_AssistantOperatorBatches"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_TemplateAssistantOperators_B_index" ON "_TemplateAssistantOperators"("B");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_client_userId_fkey') THEN
        ALTER TABLE "oauth_client" ADD CONSTRAINT "oauth_client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_refresh_token_clientId_fkey') THEN
        ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_client"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_refresh_token_sessionId_fkey') THEN
        ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_refresh_token_userId_fkey') THEN
        ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_access_token_clientId_fkey') THEN
        ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_client"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_access_token_sessionId_fkey') THEN
        ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_access_token_userId_fkey') THEN
        ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_access_token_refreshId_fkey') THEN
        ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_refreshId_fkey" FOREIGN KEY ("refreshId") REFERENCES "oauth_refresh_token"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_consent_clientId_fkey') THEN
        ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_client"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oauth_consent_userId_fkey') THEN
        ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_AssistantOperatorBatches_A_fkey') THEN
        ALTER TABLE "_AssistantOperatorBatches" ADD CONSTRAINT "_AssistantOperatorBatches_A_fkey" FOREIGN KEY ("A") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_AssistantOperatorBatches_B_fkey') THEN
        ALTER TABLE "_AssistantOperatorBatches" ADD CONSTRAINT "_AssistantOperatorBatches_B_fkey" FOREIGN KEY ("B") REFERENCES "production_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_TemplateAssistantOperators_A_fkey') THEN
        ALTER TABLE "_TemplateAssistantOperators" ADD CONSTRAINT "_TemplateAssistantOperators_A_fkey" FOREIGN KEY ("A") REFERENCES "production_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_TemplateAssistantOperators_B_fkey') THEN
        ALTER TABLE "_TemplateAssistantOperators" ADD CONSTRAINT "_TemplateAssistantOperators_B_fkey" FOREIGN KEY ("B") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
