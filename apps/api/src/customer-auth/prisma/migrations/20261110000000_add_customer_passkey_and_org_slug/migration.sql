-- AlterTable "user"
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "orgSlug" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_orgSlug_idx" ON "user"("orgSlug");
CREATE INDEX IF NOT EXISTS "user_organizationId_idx" ON "user"("organizationId");

-- AlterTable "session"
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "orgSlug" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "session_orgSlug_idx" ON "session"("orgSlug");

-- CreateTable "passkey"
CREATE TABLE IF NOT EXISTS "passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3),
    "aaguid" TEXT,

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "passkey_userId_idx" ON "passkey"("userId");
CREATE INDEX IF NOT EXISTS "passkey_credentialID_idx" ON "passkey"("credentialID");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'passkey_userId_fkey'
    ) THEN
        ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
