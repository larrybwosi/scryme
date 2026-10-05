-- Create Enum Types safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PricingModel') THEN
        CREATE TYPE "PricingModel" AS ENUM ('FIXED', 'HOURLY', 'VARIABLE');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingStatus') THEN
        CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NOSHOW');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositType') THEN
        CREATE TYPE "DepositType" AS ENUM ('FIXED', 'PERCENTAGE');
    END IF;
END $$;

-- AlterEnum
ALTER TYPE "CartStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

ALTER TYPE "EcommercePlatform" ADD VALUE IF NOT EXISTS 'STRAPI';

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "variantId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "customId" TEXT;

-- AlterTable
ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "calComApiKey" TEXT,
ADD COLUMN IF NOT EXISTS "calComId" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "customerId" TEXT,
ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "strapi_connection_config" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "strapiUrl" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "publicToken" TEXT,
    "webhookSecret" TEXT,
    "graphqlPath" TEXT NOT NULL DEFAULT '/graphql',
    "webhooksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "contentTypes" TEXT[],
    "locationMap" JSONB,
    "strapiVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strapi_connection_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "pricingModel" "PricingModel" NOT NULL DEFAULT 'FIXED',
    "price" DECIMAL(12,2) NOT NULL,
    "minPrice" DECIMAL(12,2),
    "requiresDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(12,2),
    "depositType" "DepositType" NOT NULL DEFAULT 'FIXED',
    "estimatedDuration" INTEGER,
    "bufferTimeBefore" INTEGER NOT NULL DEFAULT 0,
    "bufferTimeAfter" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service_material" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "service_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service_resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service_resource_assignment" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "service_resource_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service_staff_assignment" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "service_staff_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service_tax_rate" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "taxRateId" TEXT NOT NULL,

    CONSTRAINT "service_tax_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service_booking" (
    "id" TEXT NOT NULL,
    "locationId" TEXT,
    "organizationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduledStartTime" TIMESTAMP(3) NOT NULL,
    "scheduledEndTime" TIMESTAMP(3),
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "notes" TEXT,
    "customFields" JSONB,
    "serviceName" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "pricingModel" "PricingModel" NOT NULL,
    "recurrenceId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_recurrence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_recurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "staff_shift" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "staff_break" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "staff_break_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_verification_code" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_verification_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_staff" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "booking_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_resource" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "booking_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_consumed_material" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "booking_consumed_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "transaction_service_item" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "bookingId" TEXT,
    "serviceName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_service_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "strapi_connection_config_connectionId_key" ON "strapi_connection_config"("connectionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "strapi_connection_config_connectionId_idx" ON "strapi_connection_config"("connectionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_category_organizationId_idx" ON "service_category"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "service_category_organizationId_name_key" ON "service_category"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "service_sku_key" ON "service"("sku");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_organizationId_idx" ON "service"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "service_organizationId_sku_key" ON "service"("organizationId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "service_material_serviceId_variantId_key" ON "service_material"("serviceId", "variantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_resource_organizationId_idx" ON "service_resource"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "service_resource_assignment_serviceId_resourceId_key" ON "service_resource_assignment"("serviceId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "service_staff_assignment_serviceId_memberId_key" ON "service_staff_assignment"("serviceId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "service_tax_rate_serviceId_taxRateId_key" ON "service_tax_rate"("serviceId", "taxRateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_booking_organizationId_idx" ON "service_booking"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_booking_serviceId_idx" ON "service_booking"("serviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_booking_customerId_idx" ON "service_booking"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_booking_status_idx" ON "service_booking"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_recurrence_organizationId_idx" ON "booking_recurrence"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "staff_shift_organizationId_idx" ON "staff_shift"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "staff_shift_memberId_dayOfWeek_startTime_key" ON "staff_shift"("memberId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_verification_code_organizationId_idx" ON "booking_verification_code"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_verification_code_phoneNumber_idx" ON "booking_verification_code"("phoneNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_verification_code_email_idx" ON "booking_verification_code"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "booking_staff_bookingId_memberId_key" ON "booking_staff"("bookingId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "booking_resource_bookingId_resourceId_key" ON "booking_resource"("bookingId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "booking_consumed_material_bookingId_variantId_key" ON "booking_consumed_material"("bookingId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "transaction_service_item_bookingId_key" ON "transaction_service_item"("bookingId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transaction_service_item_transactionId_idx" ON "transaction_service_item"("transactionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transaction_service_item_serviceId_idx" ON "transaction_service_item"("serviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Customer_customId_idx" ON "Customer"("customId");

-- AddForeignKey Constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_productId_fkey') THEN
        ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_variantId_fkey') THEN
        ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'strapi_connection_config_connectionId_fkey') THEN
        ALTER TABLE "strapi_connection_config" ADD CONSTRAINT "strapi_connection_config_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ecommerce_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_category_organizationId_fkey') THEN
        ALTER TABLE "service_category" ADD CONSTRAINT "service_category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_category_parentId_fkey') THEN
        ALTER TABLE "service_category" ADD CONSTRAINT "service_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "service_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_organizationId_fkey') THEN
        ALTER TABLE "service" ADD CONSTRAINT "service_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_categoryId_fkey') THEN
        ALTER TABLE "service" ADD CONSTRAINT "service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_material_serviceId_fkey') THEN
        ALTER TABLE "service_material" ADD CONSTRAINT "service_material_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_material_variantId_fkey') THEN
        ALTER TABLE "service_material" ADD CONSTRAINT "service_material_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_resource_organizationId_fkey') THEN
        ALTER TABLE "service_resource" ADD CONSTRAINT "service_resource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_resource_assignment_serviceId_fkey') THEN
        ALTER TABLE "service_resource_assignment" ADD CONSTRAINT "service_resource_assignment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_resource_assignment_resourceId_fkey') THEN
        ALTER TABLE "service_resource_assignment" ADD CONSTRAINT "service_resource_assignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_staff_assignment_serviceId_fkey') THEN
        ALTER TABLE "service_staff_assignment" ADD CONSTRAINT "service_staff_assignment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_staff_assignment_memberId_fkey') THEN
        ALTER TABLE "service_staff_assignment" ADD CONSTRAINT "service_staff_assignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_tax_rate_serviceId_fkey') THEN
        ALTER TABLE "service_tax_rate" ADD CONSTRAINT "service_tax_rate_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_tax_rate_taxRateId_fkey') THEN
        ALTER TABLE "service_tax_rate" ADD CONSTRAINT "service_tax_rate_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_booking_locationId_fkey') THEN
        ALTER TABLE "service_booking" ADD CONSTRAINT "service_booking_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_booking_organizationId_fkey') THEN
        ALTER TABLE "service_booking" ADD CONSTRAINT "service_booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_booking_serviceId_fkey') THEN
        ALTER TABLE "service_booking" ADD CONSTRAINT "service_booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_booking_customerId_fkey') THEN
        ALTER TABLE "service_booking" ADD CONSTRAINT "service_booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_booking_recurrenceId_fkey') THEN
        ALTER TABLE "service_booking" ADD CONSTRAINT "service_booking_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "booking_recurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_booking_transactionId_fkey') THEN
        ALTER TABLE "service_booking" ADD CONSTRAINT "service_booking_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_recurrence_organizationId_fkey') THEN
        ALTER TABLE "booking_recurrence" ADD CONSTRAINT "booking_recurrence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_shift_memberId_fkey') THEN
        ALTER TABLE "staff_shift" ADD CONSTRAINT "staff_shift_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_shift_organizationId_fkey') THEN
        ALTER TABLE "staff_shift" ADD CONSTRAINT "staff_shift_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_break_shiftId_fkey') THEN
        ALTER TABLE "staff_break" ADD CONSTRAINT "staff_break_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "staff_shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_verification_code_organizationId_fkey') THEN
        ALTER TABLE "booking_verification_code" ADD CONSTRAINT "booking_verification_code_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_staff_bookingId_fkey') THEN
        ALTER TABLE "booking_staff" ADD CONSTRAINT "booking_staff_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_staff_memberId_fkey') THEN
        ALTER TABLE "booking_staff" ADD CONSTRAINT "booking_staff_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_resource_bookingId_fkey') THEN
        ALTER TABLE "booking_resource" ADD CONSTRAINT "booking_resource_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_resource_resourceId_fkey') THEN
        ALTER TABLE "booking_resource" ADD CONSTRAINT "booking_resource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "service_resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_consumed_material_bookingId_fkey') THEN
        ALTER TABLE "booking_consumed_material" ADD CONSTRAINT "booking_consumed_material_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_consumed_material_variantId_fkey') THEN
        ALTER TABLE "booking_consumed_material" ADD CONSTRAINT "booking_consumed_material_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_service_item_transactionId_fkey') THEN
        ALTER TABLE "transaction_service_item" ADD CONSTRAINT "transaction_service_item_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_service_item_serviceId_fkey') THEN
        ALTER TABLE "transaction_service_item" ADD CONSTRAINT "transaction_service_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_service_item_bookingId_fkey') THEN
        ALTER TABLE "transaction_service_item" ADD CONSTRAINT "transaction_service_item_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
