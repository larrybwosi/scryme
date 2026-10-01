-- Delete legacy connections using Strapi platform
DELETE FROM "ecommerce_connection" WHERE "platform" = 'STRAPI';

-- DropForeignKey
ALTER TABLE "strapi_connection_config" DROP CONSTRAINT IF EXISTS "strapi_connection_config_connectionId_fkey";

-- DropTable
DROP TABLE IF EXISTS "strapi_connection_config";

-- Remove STRAPI value from EcommercePlatform enum
-- PostgreSQL doesn't support dropping enum values directly via ALTER TYPE without recreating or using temporary types.
ALTER TYPE "EcommercePlatform" RENAME TO "EcommercePlatform_old";
CREATE TYPE "EcommercePlatform" AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'MAGENTO', 'BIGCOMMERCE', 'PRESTASHOP', 'OPENCART', 'CUSTOM');
ALTER TABLE "ecommerce_connection" ALTER COLUMN "platform" TYPE "EcommercePlatform" USING ("platform"::text::"EcommercePlatform");
DROP TYPE "EcommercePlatform_old";
