-- DropIndex
DROP INDEX IF EXISTS "Product_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Product_organizationId_slug_key" ON "Product"("organizationId", "slug");
