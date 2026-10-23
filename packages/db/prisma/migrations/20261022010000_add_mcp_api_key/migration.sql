-- CreateTable
CREATE TABLE "mcp_api_key" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['mcp:read', 'mcp:write']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mcp_api_key_keyPrefix_key" ON "mcp_api_key"("keyPrefix");

-- CreateIndex
CREATE INDEX "mcp_api_key_organizationId_idx" ON "mcp_api_key"("organizationId");

-- CreateIndex
CREATE INDEX "mcp_api_key_isActive_idx" ON "mcp_api_key"("isActive");

-- AddForeignKey
ALTER TABLE "mcp_api_key" ADD CONSTRAINT "mcp_api_key_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_api_key" ADD CONSTRAINT "mcp_api_key_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
