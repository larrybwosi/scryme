-- AlterTable: jwks
ALTER TABLE "jwks" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "jwks" ADD COLUMN IF NOT EXISTS "alg" TEXT;
ALTER TABLE "jwks" ADD COLUMN IF NOT EXISTS "crv" TEXT;

-- AlterTable: two_factor
ALTER TABLE "two_factor" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN DEFAULT true;
ALTER TABLE "two_factor" ADD COLUMN IF NOT EXISTS "failedVerificationCount" INTEGER DEFAULT 0;
ALTER TABLE "two_factor" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- AlterTable: oauth_client
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "clientDiscoveryId" TEXT;
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "public" BOOLEAN DEFAULT false;
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "subjectType" TEXT;
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "clientCredentialsScopes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "backchannelLogoutUri" TEXT;
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "backchannelLogoutSessionRequired" BOOLEAN;
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "jwks" TEXT;
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "jwksUri" TEXT;
ALTER TABLE "oauth_client" ADD COLUMN IF NOT EXISTS "dpopBoundAccessTokens" BOOLEAN DEFAULT false;
ALTER TABLE "oauth_client" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "oauth_client" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "oauth_client" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- CreateTable: oauth_resource
CREATE TABLE IF NOT EXISTS "oauth_resource" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessTokenTtl" INTEGER,
    "refreshTokenTtl" INTEGER,
    "signingAlgorithm" TEXT,
    "signingKeyId" TEXT,
    "allowedScopes" TEXT[],
    "customClaims" JSONB,
    "dpopBoundAccessTokensRequired" BOOLEAN DEFAULT false,
    "disabled" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "policyVersion" INTEGER DEFAULT 1,
    "metadata" JSONB,

    CONSTRAINT "oauth_resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_resource_identifier_key" ON "oauth_resource"("identifier");

-- CreateTable: oauth_client_resource
CREATE TABLE IF NOT EXISTS "oauth_client_resource" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_client_resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauth_client_resource_clientId_idx" ON "oauth_client_resource"("clientId");
CREATE INDEX IF NOT EXISTS "oauth_client_resource_resourceId_idx" ON "oauth_client_resource"("resourceId");
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_client_resource_clientId_resourceId_key" ON "oauth_client_resource"("clientId", "resourceId");

-- AlterTable: oauth_refresh_token
ALTER TABLE "oauth_refresh_token" ADD COLUMN IF NOT EXISTS "authorizationCodeId" TEXT;
ALTER TABLE "oauth_refresh_token" ADD COLUMN IF NOT EXISTS "resources" TEXT[];
ALTER TABLE "oauth_refresh_token" ADD COLUMN IF NOT EXISTS "requestedUserInfoClaims" TEXT[];
ALTER TABLE "oauth_refresh_token" ADD COLUMN IF NOT EXISTS "rotatedAt" TIMESTAMP(3);
ALTER TABLE "oauth_refresh_token" ADD COLUMN IF NOT EXISTS "rotationReplayResponse" TEXT;
ALTER TABLE "oauth_refresh_token" ADD COLUMN IF NOT EXISTS "rotationReplayExpiresAt" TIMESTAMP(3);
ALTER TABLE "oauth_refresh_token" ADD COLUMN IF NOT EXISTS "confirmation" JSONB;
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "sessionId" DROP NOT NULL;
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "expiresAt" DROP NOT NULL;
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: oauth_refresh_token indices
CREATE INDEX IF NOT EXISTS "oauth_refresh_token_clientId_idx" ON "oauth_refresh_token"("clientId");
CREATE INDEX IF NOT EXISTS "oauth_refresh_token_sessionId_idx" ON "oauth_refresh_token"("sessionId");
CREATE INDEX IF NOT EXISTS "oauth_refresh_token_userId_idx" ON "oauth_refresh_token"("userId");
CREATE INDEX IF NOT EXISTS "oauth_refresh_token_authorizationCodeId_idx" ON "oauth_refresh_token"("authorizationCodeId");

-- AlterTable: oauth_access_token
ALTER TABLE "oauth_access_token" ADD COLUMN IF NOT EXISTS "authorizationCodeId" TEXT;
ALTER TABLE "oauth_access_token" ADD COLUMN IF NOT EXISTS "resources" TEXT[];
ALTER TABLE "oauth_access_token" ADD COLUMN IF NOT EXISTS "requestedUserInfoClaims" TEXT[];
ALTER TABLE "oauth_access_token" ADD COLUMN IF NOT EXISTS "confirmation" JSONB;
ALTER TABLE "oauth_access_token" ALTER COLUMN "token" DROP NOT NULL;
ALTER TABLE "oauth_access_token" ALTER COLUMN "expiresAt" DROP NOT NULL;
ALTER TABLE "oauth_access_token" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "oauth_access_token" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: oauth_access_token indices
CREATE INDEX IF NOT EXISTS "oauth_access_token_clientId_idx" ON "oauth_access_token"("clientId");
CREATE INDEX IF NOT EXISTS "oauth_access_token_sessionId_idx" ON "oauth_access_token"("sessionId");
CREATE INDEX IF NOT EXISTS "oauth_access_token_userId_idx" ON "oauth_access_token"("userId");
CREATE INDEX IF NOT EXISTS "oauth_access_token_authorizationCodeId_idx" ON "oauth_access_token"("authorizationCodeId");
CREATE INDEX IF NOT EXISTS "oauth_access_token_refreshId_idx" ON "oauth_access_token"("refreshId");

-- AlterTable: oauth_consent
ALTER TABLE "oauth_consent" ADD COLUMN IF NOT EXISTS "resources" TEXT[];
ALTER TABLE "oauth_consent" ADD COLUMN IF NOT EXISTS "requestedUserInfoClaims" TEXT[];
ALTER TABLE "oauth_consent" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "oauth_consent" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "oauth_consent" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "oauth_consent" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- CreateIndex: oauth_consent indices
CREATE INDEX IF NOT EXISTS "oauth_consent_clientId_idx" ON "oauth_consent"("clientId");
CREATE INDEX IF NOT EXISTS "oauth_consent_userId_idx" ON "oauth_consent"("userId");

-- CreateTable: oauth_client_assertion
CREATE TABLE IF NOT EXISTS "oauth_client_assertion" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_client_assertion_pkey" PRIMARY KEY ("id")
);

-- Foreign Key Constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'oauth_client_resource_clientId_fkey'
    ) THEN
        ALTER TABLE "oauth_client_resource" ADD CONSTRAINT "oauth_client_resource_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_client"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'oauth_client_resource_resourceId_fkey'
    ) THEN
        ALTER TABLE "oauth_client_resource" ADD CONSTRAINT "oauth_client_resource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "oauth_resource"("identifier") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
