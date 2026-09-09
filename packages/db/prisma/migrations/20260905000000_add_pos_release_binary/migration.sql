-- CreateTable
CREATE TABLE "pos_release_binary" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "mimeType" TEXT,
    "sha256" TEXT,
    "releaseTag" TEXT NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_release_binary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_release_binary_platform_variant_isLatest_idx" ON "pos_release_binary"("platform", "variant", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX "pos_release_binary_platform_variant_version_key" ON "pos_release_binary"("platform", "variant", "version");
