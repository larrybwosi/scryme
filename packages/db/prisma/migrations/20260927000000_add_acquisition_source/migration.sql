-- AlterTable
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acquisitionSource" TEXT;

-- AlterTable
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "acquisitionSource" TEXT;
