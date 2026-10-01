-- Create Enum Types safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommunicationChannel') THEN
        CREATE TYPE "CommunicationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'SCRYMECHAT', 'SYSTEM');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommunicationDirection') THEN
        CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommunicationMessageStatus') THEN
        CREATE TYPE "CommunicationMessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
    END IF;
END $$;

-- Create Table communication_threads
CREATE TABLE IF NOT EXISTS "communication_threads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL DEFAULT 'WHATSAPP',
    "participantPhone" TEXT NOT NULL,
    "participantName" TEXT,
    "crmRecordId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_threads_pkey" PRIMARY KEY ("id")
);

-- Create Table communication_messages
CREATE TABLE IF NOT EXISTS "communication_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CommunicationMessageStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "senderMemberId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- Create Table whatsapp_templates
CREATE TABLE IF NOT EXISTS "whatsapp_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en_US',
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "components" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- Create Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "communication_threads_organizationId_channel_participantPhone_key"
    ON "communication_threads"("organizationId", "channel", "participantPhone");

CREATE UNIQUE INDEX IF NOT EXISTS "communication_messages_externalId_key"
    ON "communication_messages"("externalId");

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_templates_organizationId_name_language_key"
    ON "whatsapp_templates"("organizationId", "name", "language");

-- Create Indexes
CREATE INDEX IF NOT EXISTS "communication_threads_organizationId_idx" ON "communication_threads"("organizationId");
CREATE INDEX IF NOT EXISTS "communication_threads_participantPhone_idx" ON "communication_threads"("participantPhone");
CREATE INDEX IF NOT EXISTS "communication_threads_crmRecordId_idx" ON "communication_threads"("crmRecordId");

CREATE INDEX IF NOT EXISTS "communication_messages_threadId_idx" ON "communication_messages"("threadId");
CREATE INDEX IF NOT EXISTS "communication_messages_organizationId_idx" ON "communication_messages"("organizationId");
CREATE INDEX IF NOT EXISTS "communication_messages_externalId_idx" ON "communication_messages"("externalId");

CREATE INDEX IF NOT EXISTS "whatsapp_templates_organizationId_idx" ON "whatsapp_templates"("organizationId");

-- Foreign Key Constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_threads_organizationId_fkey') THEN
        ALTER TABLE "communication_threads" ADD CONSTRAINT "communication_threads_organizationId_fkey"
            FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_threads_crmRecordId_fkey') THEN
        ALTER TABLE "communication_threads" ADD CONSTRAINT "communication_threads_crmRecordId_fkey"
            FOREIGN KEY ("crmRecordId") REFERENCES "crm_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_messages_threadId_fkey') THEN
        ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_threadId_fkey"
            FOREIGN KEY ("threadId") REFERENCES "communication_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_messages_organizationId_fkey') THEN
        ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_organizationId_fkey"
            FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_messages_senderMemberId_fkey') THEN
        ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_senderMemberId_fkey"
            FOREIGN KEY ("senderMemberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_templates_organizationId_fkey') THEN
        ALTER TABLE "whatsapp_templates" ADD CONSTRAINT "whatsapp_templates_organizationId_fkey"
            FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
