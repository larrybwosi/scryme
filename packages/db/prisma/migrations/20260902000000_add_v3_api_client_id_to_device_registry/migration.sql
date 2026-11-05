-- AlterTable
ALTER TABLE "device_registry" ALTER COLUMN "apiKeyId" DROP NOT NULL;
ALTER TABLE "device_registry" ADD COLUMN IF NOT EXISTS "v3ApiClientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "device_registry_v3ApiClientId_key" ON "device_registry"("v3ApiClientId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'device_registry_v3ApiClientId_fkey') THEN
        ALTER TABLE "device_registry" ADD CONSTRAINT "device_registry_v3ApiClientId_fkey" FOREIGN KEY ("v3ApiClientId") REFERENCES "v3_api_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
