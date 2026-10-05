-- Delete legacy connections using Strapi platform
DELETE FROM "ecommerce_connection" WHERE "platform" = 'STRAPI';

-- DropForeignKey
ALTER TABLE "strapi_connection_config" DROP CONSTRAINT IF EXISTS "strapi_connection_config_connectionId_fkey";

-- DropTable
DROP TABLE IF EXISTS "strapi_connection_config";

-- Remove STRAPI value from EcommercePlatform enum safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EcommercePlatform') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EcommercePlatform_old') THEN
        ALTER TYPE "EcommercePlatform" RENAME TO "EcommercePlatform_old";
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EcommercePlatform') THEN
        CREATE TYPE "EcommercePlatform" AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'MAGENTO', 'BIGCOMMERCE', 'PRESTASHOP', 'OPENCART', 'CUSTOM');
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EcommercePlatform_old') THEN
        ALTER TABLE "ecommerce_connection" ALTER COLUMN "platform" TYPE "EcommercePlatform" USING ("platform"::text::"EcommercePlatform");
        DROP TYPE "EcommercePlatform_old";
    END IF;
END $$;
