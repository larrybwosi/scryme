-- DropIndex
DROP INDEX "CartItem_cartId_productId_variantId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "bookingDetails" JSONB,
ADD COLUMN     "serviceId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "variantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "customFields" JSONB;

-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN     "managersCanManageShifts" BOOLEAN NOT NULL DEFAULT false;
