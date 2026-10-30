-- AlterTable: oauth_access_token
ALTER TABLE "oauth_access_token" ADD COLUMN IF NOT EXISTS "revoked" TIMESTAMP(3);

-- Delete duplicate account records keeping the most recently updated/created row per (providerId, accountId)
DELETE FROM "account" a
WHERE a.id NOT IN (
    SELECT DISTINCT ON ("providerId", "accountId") id
    FROM "account"
    ORDER BY "providerId", "accountId", "updatedAt" DESC, "createdAt" DESC
);

-- CreateIndex: account_providerId_accountId_key
CREATE UNIQUE INDEX IF NOT EXISTS "account_providerId_accountId_key" ON "account"("providerId", "accountId");
