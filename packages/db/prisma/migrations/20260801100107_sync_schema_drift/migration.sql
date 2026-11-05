-- DropIndex
DROP INDEX IF EXISTS "CartItem_cartId_productId_variantId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "bookingDetails" JSONB,
ADD COLUMN IF NOT EXISTS "serviceId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "variantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "customFields" JSONB;

-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "managersCanManageShifts" BOOLEAN NOT NULL DEFAULT false;
