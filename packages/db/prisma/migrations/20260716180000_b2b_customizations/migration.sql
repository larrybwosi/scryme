-- AlterTable
ALTER TABLE "business_account" ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "customTheme" TEXT,
ADD COLUMN "isEnterprise" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "discountPercentage" DOUBLE PRECISION,
ADD COLUMN "paymentTermsDays" INTEGER;
