-- DropForeignKey
ALTER TABLE "standalone_device" DROP CONSTRAINT IF EXISTS "standalone_device_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "standalone_device_key" DROP CONSTRAINT IF EXISTS "standalone_device_key_deviceId_fkey";

-- DropTable
DROP TABLE IF EXISTS "standalone_setup_key";

-- DropTable
DROP TABLE IF EXISTS "standalone_device_key";

-- DropTable
DROP TABLE IF EXISTS "standalone_device";
