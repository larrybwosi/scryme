-- AlterTable
ALTER TABLE "account" ADD COLUMN "issuer" TEXT;

-- CreateIndex
CREATE INDEX "account_issuer_accountId_idx" ON "account"("issuer", "accountId");
