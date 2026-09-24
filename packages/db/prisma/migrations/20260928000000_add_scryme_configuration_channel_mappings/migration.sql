-- AlterTable
ALTER TABLE "scryme_configuration" ADD COLUMN IF NOT EXISTS "channelMappings" JSONB;
