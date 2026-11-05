-- AlterTable
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "account_issuer_accountId_idx" ON "account"("issuer", "accountId");
