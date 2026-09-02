-- AlterTable
ALTER TABLE "device_registry" ALTER COLUMN "apiKeyId" DROP NOT NULL;
ALTER TABLE "device_registry" ADD COLUMN "v3ApiClientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "device_registry_v3ApiClientId_key" ON "device_registry"("v3ApiClientId");

-- AddForeignKey
ALTER TABLE "device_registry" ADD CONSTRAINT "device_registry_v3ApiClientId_fkey" FOREIGN KEY ("v3ApiClientId") REFERENCES "v3_api_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
