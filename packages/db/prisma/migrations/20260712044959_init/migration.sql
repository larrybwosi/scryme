-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'CLIENT', 'MEMBER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "RateLimitTier" AS ENUM ('LOW', 'STANDARD', 'HIGH', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "ExpirationStatus" AS ENUM ('FRESH', 'NEAR_EXPIRY', 'EXPIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "DisposalReason" AS ENUM ('EXPIRED', 'NEAR_EXPIRY_UNSOLD', 'DAMAGED', 'QUALITY_ISSUE', 'CONTAMINATION', 'RECALL', 'OTHER');

-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BakeryAuthMode" AS ENUM ('SSO', 'CARD_PIN');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('COMMISSION', 'FIXED_FEE', 'PROFIT_MARGIN', 'NONE');

-- CreateEnum
CREATE TYPE "ReconciliationPolicy" AS ENUM ('RETURN_TO_STOCK', 'MARK_AS_WASTE', 'PARTNER_CHARGED');

-- CreateEnum
CREATE TYPE "WalletTxType" AS ENUM ('BENEFIT_ACCRUAL', 'WITHDRAWAL', 'ADJUSTMENT', 'RECONCILIATION_CHARGE', 'DEPOSIT');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('EMAIL', 'SMS', 'IN_PERSON', 'IN_APP', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "CrmFieldType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'MULTI_SELECT', 'EMAIL', 'PHONE', 'URL', 'JSON');

-- CreateEnum
CREATE TYPE "CrmRelationshipType" AS ENUM ('ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY');

-- CreateEnum
CREATE TYPE "CrmFollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CrmFollowUpPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CrmFollowUpType" AS ENUM ('CALL', 'MEETING', 'EMAIL', 'PREPARATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ONLINE', 'OFFLINE', 'ON_DELIVERY');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'CAR', 'VAN', 'BICYCLE');

-- CreateEnum
CREATE TYPE "CustomerCreationType" AS ENUM ('MEMBER_CREATED', 'SELF_REGISTERED', 'IMPORTED', 'API_CREATED', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferralTrigger" AS ENUM ('SIGNUP', 'FIRST_PURCHASE');

-- CreateEnum
CREATE TYPE "EcommercePlatform" AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'MAGENTO', 'BIGCOMMERCE', 'PRESTASHOP', 'OPENCART', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED');

-- CreateEnum
CREATE TYPE "EntitySyncType" AS ENUM ('PRODUCTS', 'INVENTORY', 'ORDERS', 'CUSTOMERS', 'CATEGORIES', 'PRICES');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'REIMBURSED', 'VOIDED');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PettyCashTransactionType" AS ENUM ('TOP_UP', 'EXPENSE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('ELECTRICITY', 'WATER', 'INTERNET', 'GAS', 'WASTE_MANAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalRequestType" AS ENUM ('EXPENSE', 'PURCHASE_ORDER', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'INVOICE', 'MEMBER_CREATION');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUEST_CHANGES', 'CANCELLED', 'REQUEST_INFO');

-- CreateEnum
CREATE TYPE "ConditionType" AS ENUM ('AMOUNT_RANGE', 'EXPENSE_CATEGORY', 'LOCATION', 'IS_REIMBURSABLE', 'PROJECT', 'HAS_RECEIPT', 'BUDGET_VARIANCE');

-- CreateEnum
CREATE TYPE "ApprovalActionType" AS ENUM ('ROLE', 'SPECIFIC_MEMBER', 'SUBMITTER_MANAGER', 'DEPARTMENT_HEAD', 'WINDMILL_SCRIPT', 'NOTIFICATION_ONLY');

-- CreateEnum
CREATE TYPE "ApprovalMode" AS ENUM ('ANY_ONE', 'ALL');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'BILLED', 'PARTIALLY_PAID', 'PAID', 'COMPLETED', 'CANCELLED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PurchaseReturnStatus" AS ENUM ('REQUESTED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT', 'CARD', 'MOBILE_PAYMENT', 'MPESA_C2B', 'BANK_TRANSFER', 'CHEQUE', 'STORE_CREDIT', 'GIFT_CARD', 'LOYALTY_POINTS', 'ON_ACCOUNT', 'MPESA', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'UNPAID', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'PARTIALLY_PAID', 'OVERPAID', 'PAID', 'CANCELLED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ThreeWayMatchStatus" AS ENUM ('NO_MATCH', 'PARTIAL_MATCH', 'MATCHED', 'VARIANCE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountSubType" AS ENUM ('CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'INVENTORY', 'OTHER_CURRENT_ASSET', 'FIXED_ASSET', 'ACCUMULATED_DEPRECIATION', 'ACCOUNTS_PAYABLE', 'TAX_PAYABLE', 'OTHER_CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'EQUITY', 'RETAINED_EARNINGS', 'REVENUE', 'OTHER_INCOME', 'COST_OF_GOODS_SOLD', 'OPERATING_EXPENSE', 'FINANCIAL_EXPENSE', 'OTHER_EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "JournalSource" AS ENUM ('MANUAL', 'SALE', 'PURCHASE', 'EXPENSE', 'PAYMENT', 'PAYROLL', 'INVENTORY_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "BankReconciliationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'RECONCILED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UNMATCHED', 'MATCHED', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "HulyConnectionHealth" AS ENUM ('HEALTHY', 'DEGRADED', 'DISCONNECTED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "HulyConnectionMode" AS ENUM ('REST', 'WEBSOCKET');

-- CreateEnum
CREATE TYPE "HulyEventType" AS ENUM ('STOCK_LOW', 'STOCK_OUT', 'ORDER_CREATED', 'ORDER_VOIDED', 'PURCHASE_CREATED', 'PURCHASE_APPROVED', 'PAYMENT_DUE_SOON', 'PAYMENT_OVERDUE', 'MEMBER_JOINED', 'APPROVAL_REQUIRED', 'APPROVAL_COMPLETED', 'RECONCILIATION_STARTED', 'RECONCILIATION_COMPLETED', 'BAKERY_BATCH_EXPIRING', 'BAKERY_BATCH_EXPIRED', 'BAKERY_BATCH_DISPOSED', 'BAKERY_DAILY_BATCHES_CREATED', 'BAKERY_BATCH_AUTO_CANCELLED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "HulyNotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HulyEventStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('E_COMMERCE', 'ACCOUNTING', 'MARKETING', 'PAYMENT_GATEWAY', 'CRM', 'COMMUNICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('API_KEY', 'OAUTH2', 'OTHER');

-- CreateEnum
CREATE TYPE "IntegrationEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('RAW_MATERIAL', 'FINISHED_GOOD', 'MERCHANDISE', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('manufacturer', 'distributor', 'wholesaler', 'service_provider');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "RecallStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('RETAIL_SHOP', 'WAREHOUSE', 'DISTRIBUTION', 'PRODUCTION', 'SUPPLIER', 'CUSTOMER', 'TEMPORARY', 'OTHER');

-- CreateEnum
CREATE TYPE "StorageUnitType" AS ENUM ('SHELF', 'RACK', 'BIN', 'DRAWER', 'PALLET', 'SECTION', 'REFRIGERATOR', 'FREEZER', 'CABINET', 'BULK_AREA', 'OTHER');

-- CreateEnum
CREATE TYPE "LoyaltyRuleType" AS ENUM ('POINTS_PER_CURRENCY', 'POINTS_PER_ITEM', 'FIXED_POINTS');

-- CreateEnum
CREATE TYPE "LoyaltyRewardType" AS ENUM ('DISCOUNT_PERCENTAGE', 'DISCOUNT_FIXED_AMOUNT', 'FREE_PRODUCT', 'STORE_CREDIT');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED', 'REFUND_VOID');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TierBasis" AS ENUM ('CURRENT_BALANCE', 'LIFETIME_POINTS');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MpesaEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'CASHIER', 'REPORTER', 'CUSTOMER', 'GUEST');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InventoryPolicy" AS ENUM ('FIFO', 'LIFO', 'FEFO');

-- CreateEnum
CREATE TYPE "PriceSyncMode" AS ENUM ('MANUAL', 'AUTOMATIC', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "SupplierSelection" AS ENUM ('PREFERRED', 'LOWEST_COST', 'LATEST_DELIVERY');

-- CreateEnum
CREATE TYPE "DepartmentMemberRole" AS ENUM ('HEAD', 'MANAGER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('POS_TERMINAL', 'MOBILE_POS', 'KIOSK', 'TABLET', 'BAKERY_TERMINAL');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ApiKeyEnvironment" AS ENUM ('LIVE', 'TEST');

-- CreateEnum
CREATE TYPE "ApiKeyType" AS ENUM ('POS', 'CLIENT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SALES_REPORT', 'SALES_WEEKLY', 'SALES_MONTHLY', 'INVENTORY_WEEKLY', 'INVENTORY_MONTHLY', 'INVENTORY_REPORT', 'EXPENSE_REPORT', 'BAKERY_REPORT', 'TAX_REPORT');

-- CreateEnum
CREATE TYPE "PricingMethod" AS ENUM ('FIXED', 'COST_MARKUP', 'COST_MARGIN');

-- CreateEnum
CREATE TYPE "RoundingMethod" AS ENUM ('NONE', 'UP', 'DOWN', 'NEAREST', 'PSYCHOLOGICAL');

-- CreateEnum
CREATE TYPE "PriceApprovalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE');

-- CreateEnum
CREATE TYPE "BundleType" AS ENUM ('FIXED', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "PriceChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'ORDERED', 'IGNORED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'STOCK_RECEIVED', 'STOCK_ADJUSTED', 'STOCK_TRANSFERRED', 'PURCHASE_CREATED', 'PURCHASE_APPROVED', 'PURCHASE_CANCELLED', 'SUPPLIER_UPDATED', 'REORDER_TRIGGERED');

-- CreateEnum
CREATE TYPE "StockTakeStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyncOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SYNC_FULL');

-- CreateEnum
CREATE TYPE "ValuationMethod" AS ENUM ('FIFO', 'LIFO', 'WEIGHTED_AVG', 'STANDARD');

-- CreateEnum
CREATE TYPE "QualityCheckStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "SerialNumberStatus" AS ENUM ('IN_STOCK', 'SOLD', 'TRANSFERRED', 'RETURNED', 'DAMAGED', 'LOST', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssemblyStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockAdjustmentReason" AS ENUM ('INITIAL_STOCK', 'RECEIVED_PURCHASE', 'DAMAGED', 'EXPIRED', 'LOST', 'STOLEN', 'FOUND', 'RETURN_TO_SUPPLIER', 'CUSTOMER_RETURN', 'INVENTORY_COUNT', 'TRANSFER_OUT', 'TRANSFER_IN', 'OTHER', 'ORDER_COMMIT', 'ORDER_CANCEL', 'SALE');

-- CreateEnum
CREATE TYPE "StockRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'PARTIALLY_FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockRequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE_RECEIPT', 'SALE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER', 'CUSTOMER_RETURN', 'SUPPLIER_RETURN', 'INITIAL_STOCK', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'QUALITY_REJECTION', 'UNPACK_OUT', 'UNPACK_IN');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SHIPPED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StockReportCategory" AS ENUM ('STOCK_LEVELS', 'INVENTORY_VALUATION', 'STOCK_MOVEMENT', 'AGING_REPORT', 'SUPPLIER_PERFORMANCE', 'TRANSFERS', 'TRANSFER_PERFORMANCE', 'USER_ACTIVITY', 'BUSINESS_INSIGHTS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "StockReportType" AS ENUM ('SUMMARY', 'DETAILED', 'ANALYTICAL');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ON_DEMAND');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "StockReportParameterType" AS ENUM ('DATE_RANGE', 'LOCATION', 'PRODUCT_CATEGORY', 'SUPPLIER', 'PRODUCT_VARIANT');

-- CreateEnum
CREATE TYPE "AutomationFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED', 'ERROR');

-- CreateEnum
CREATE TYPE "ReportChannelType" AS ENUM ('WORKSPACE_CHANNEL', 'EMAIL', 'WEBHOOK', 'TELEGRAM', 'DISCORD');

-- CreateEnum
CREATE TYPE "ReportChannelStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('WITHHOLDING_TAX', 'STAMP_DUTY', 'RENTAL_INCOME_TAX', 'DIVIDENDS_TAX', 'CAPITAL_GAINS_TAX', 'VAT', 'SALES_TAX', 'EXCISE_DUTY', 'INCOME_TAX', 'PROPERTY_TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'FILED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('POS_SALE', 'ONLINE_ORDER', 'SALES_ORDER', 'SERVICE_BOOKING', 'SUBSCRIPTION', 'QUOTE');

-- CreateEnum
CREATE TYPE "TransactionChannel" AS ENUM ('POS_TERMINAL', 'ECOMMERCE_STORE', 'MOBILE_APP', 'MANUAL_ENTRY', 'THIRD_PARTY_API');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PROCESSING', 'READY', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED', 'EXPIRED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('IMMEDIATE', 'PICKUP', 'DELIVERY', 'SHIPPING', 'DIGITAL', 'DINE_IN', 'SERVICE');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('PENDING', 'FULFILLED', 'CANCELLED', 'RESERVED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'SETTLED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PodType" AS ENUM ('DIGITAL_APP', 'PHYSICAL_PAPER', 'TOKEN_EXCHANGE');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReturnItemStatus" AS ENUM ('PENDING', 'RECEIVED', 'ACCEPTED', 'REJECTED', 'RESTOCKED', 'REFUNDED', 'REPLACED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'CHANGE_OF_MIND', 'SIZE_COLOR_ISSUE', 'ARRIVED_LATE', 'DUPLICATE_ORDER', 'DAMAGED_IN_TRANSIT', 'OTHER');

-- CreateEnum
CREATE TYPE "DrawerStatus" AS ENUM ('OPEN', 'CLOSED', 'BALANCED', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'INVITE', 'ACCESS_DENIED', 'RESTORE', 'EXPORT', 'BULK_UPDATE');

-- CreateEnum
CREATE TYPE "AuditLogStatus" AS ENUM ('SUCCESS', 'FAILURE', 'WARNING');

-- CreateEnum
CREATE TYPE "AuditLogSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'MEMBER', 'ROLE', 'PERMISSION', 'AUTH_CHECK', 'ORGANIZATION', 'SETTINGS', 'UNIT_DEFINITION', 'UNIT_CONVERSION', 'ADDRESS', 'TRANSACTION', 'PAYMENT_GATEWAY', 'EXPENSE', 'BUDGET', 'RECURRING_EXPENSE', 'TAX', 'PRODUCT', 'CATEGORY', 'STOCK_BATCH', 'STOCK_ADJUSTMENT', 'STOCK_MOVEMENT', 'INVENTORY_LOCATION', 'CASH_DRAWER', 'SALE', 'PURCHASE', 'RETURN', 'SUPPLIER', 'CUSTOMER', 'LOYALTY', 'ATTACHMENT', 'NOTIFICATION', 'PROJECT', 'ATTENDANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('MASS', 'VOLUME', 'LENGTH', 'AREA', 'COUNT', 'TIME', 'TEMPERATURE', 'ENERGY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IndustryCategory" AS ENUM ('UNIVERSAL', 'FOOD_SERVICE', 'RETAIL', 'MANUFACTURING', 'HEALTHCARE', 'CONSTRUCTION', 'AGRICULTURE', 'HOSPITALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING', 'BOTH');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "WindmillExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ZitadelConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ZitadelWebhookStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN,
    "image" TEXT,
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "username" TEXT,
    "activeOrganizationId" TEXT,
    "displayUsername" TEXT,
    "scrymeUserId" TEXT,
    "banner" TEXT,
    "notificationPrefs" JSONB,
    "referralCode" TEXT,
    "referrerId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apikey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "start" TEXT,
    "prefix" TEXT,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refillInterval" INTEGER,
    "refillAmount" INTEGER,
    "lastRefillAt" TIMESTAMP(3),
    "enabled" BOOLEAN,
    "rateLimitEnabled" BOOLEAN,
    "rateLimitTimeWindow" INTEGER,
    "rateLimitMax" INTEGER,
    "requestCount" INTEGER,
    "remaining" INTEGER,
    "lastRequest" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "permissions" TEXT,
    "metadata" TEXT,

    CONSTRAINT "apikey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jwks" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jwks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_usage_log" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "api_key_usage_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_client" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "name" TEXT,
    "icon" TEXT,
    "uri" TEXT,
    "contacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tos" TEXT,
    "policy" TEXT,
    "softwareId" TEXT,
    "softwareVersion" TEXT,
    "softwareStatement" TEXT,
    "redirectUris" TEXT[],
    "postLogoutRedirectUris" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responseTypes" TEXT[] DEFAULT ARRAY['code']::TEXT[],
    "grantTypes" TEXT[] DEFAULT ARRAY['authorization_code', 'refresh_token']::TEXT[],
    "tokenEndpointAuthMethod" TEXT DEFAULT 'client_secret_post',
    "public" BOOLEAN DEFAULT false,
    "disabled" BOOLEAN DEFAULT false,
    "skipConsent" BOOLEAN DEFAULT false,
    "enableEndSession" BOOLEAN DEFAULT false,
    "requirePKCE" BOOLEAN DEFAULT true,
    "userId" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_refresh_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referenceId" TEXT,
    "sessionId" TEXT,
    "scopes" TEXT[],
    "authTime" TIMESTAMP(3),
    "revoked" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_access_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "referenceId" TEXT,
    "sessionId" TEXT,
    "refreshId" TEXT,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_access_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "referenceId" TEXT,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bakery_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bakery_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "producesVariantId" TEXT NOT NULL,
    "yieldQuantity" DECIMAL(10,4) NOT NULL,
    "systemUnitId" TEXT,
    "orgUnitId" TEXT,
    "costPrice" DECIMAL(10,2),
    "description" TEXT,
    "prepTime" INTEGER,
    "bakeTime" INTEGER,
    "totalTime" INTEGER,
    "difficulty" "RecipeDifficulty" DEFAULT 'EASY',
    "temperatureCelsius" INTEGER,
    "servingSize" TEXT,
    "instructions" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "plannedQuantity" DECIMAL(10,4) NOT NULL,
    "actualQuantity" DECIMAL(10,4),
    "systemUnitId" TEXT,
    "orgUnitId" TEXT,
    "recipeMultiplier" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "status" "BatchStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "leadBakerId" TEXT,
    "notes" TEXT,
    "createdFromTemplateId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "canceledById" TEXT,
    "outputLocationId" TEXT,
    "productionDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "shelfLifeDays" INTEGER,
    "expirationStatus" "ExpirationStatus" NOT NULL DEFAULT 'FRESH',
    "nearExpiryAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "expiryAlertSentAt" TIMESTAMP(3),
    "disposedAt" TIMESTAMP(3),
    "disposedById" TEXT,
    "disposalReason" "DisposalReason",
    "disposalNotes" TEXT,
    "tags" TEXT[],
    "qcData" JSONB,
    "wasteQuantity" DECIMAL(10,4),
    "wasteReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isRecalled" BOOLEAN NOT NULL DEFAULT false,
    "recallId" TEXT,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "systemUnitId" TEXT,
    "orgUnitId" TEXT,
    "recipeMultiplier" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "duration" INTEGER,
    "leadBakerId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shelfLifeDays" INTEGER,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_schedule" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientVariantId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "systemUnitId" TEXT,
    "orgUnitId" TEXT,
    "preparationNotes" TEXT,

    CONSTRAINT "recipe_ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bakery_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultBakerId" TEXT,
    "autoCreateDailyBatches" BOOLEAN NOT NULL DEFAULT false,
    "expiryWarningDays" INTEGER NOT NULL DEFAULT 3,
    "authMode" "BakeryAuthMode" NOT NULL DEFAULT 'CARD_PIN',
    "batchPrefix" TEXT NOT NULL DEFAULT 'BAT',
    "batchSeparator" TEXT NOT NULL DEFAULT '-',
    "batchDateFormat" TEXT NOT NULL DEFAULT 'YYYYMMDD',
    "batchSequence" TEXT NOT NULL DEFAULT '4',
    "autoApproveBatches" BOOLEAN NOT NULL DEFAULT false,
    "lowStockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "scrymeReportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scrymeReportDay" INTEGER NOT NULL DEFAULT 1,
    "scrymeReportTime" TEXT NOT NULL DEFAULT '08:00',
    "scrymeReportSections" JSONB,
    "scrymeReportChannel" TEXT DEFAULT 'production-reports',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bakery_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_ingredient_consumption" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "stockBatchId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_ingredient_consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_incident" (
    "id" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "RiskLevel" NOT NULL DEFAULT 'low',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "batchId" TEXT,
    "stockBatchId" TEXT,
    "supplierId" TEXT,
    "reportedById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bakery_bakers" (
    "id" TEXT NOT NULL,
    "bakerySettingsId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "specialties" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bakery_bakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "organizationId" TEXT NOT NULL,
    "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionRate" DECIMAL(5,2),
    "fixedFee" DECIMAL(12,2),
    "benefitType" "BenefitType" NOT NULL DEFAULT 'COMMISSION',
    "reconciliationPolicy" "ReconciliationPolicy" NOT NULL DEFAULT 'RETURN_TO_STOCK',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_wallet_log" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "transactionType" "WalletTxType" NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_wallet_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "channel" "CampaignChannel" NOT NULL,
    "segmentId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "workflowId" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalConverted" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_segments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_workflows" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_workflow_instances" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "currentNodeId" TEXT,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recordId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_object_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelPlural" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_object_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_field_definitions" (
    "id" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CrmFieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" JSONB,
    "options" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_records" (
    "id" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_relationship_definitions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CrmRelationshipType" NOT NULL,
    "sourceObjectId" TEXT NOT NULL,
    "targetObjectId" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_relationship_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_associations" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "targetRecordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_notes" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT,
    "timelineDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_follow_ups" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priority" "CrmFollowUpPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "CrmFollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "type" "CrmFollowUpType" NOT NULL DEFAULT 'OTHER',
    "assignedToId" TEXT,
    "locationId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "escalationSent" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "customerType" TEXT,
    "dateOfBirth" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "taxId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "creationType" "CustomerCreationType" NOT NULL DEFAULT 'MEMBER_CREATED',
    "pinnedLocation" JSONB,
    "deliveryNotes" TEXT,
    "tags" TEXT[],
    "defaultLocationId" TEXT,
    "organizationId" TEXT NOT NULL,
    "businessAccountId" TEXT,
    "crmRecordId" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "organizationId" TEXT NOT NULL,
    "defaultLocationId" TEXT,
    "crmRecordId" TEXT,

    CONSTRAINT "business_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BConnection" (
    "id" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowedCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priceListId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "B2BConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_program" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "referrerReward" INTEGER NOT NULL,
    "refereeReward" INTEGER NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'points',
    "trigger" "ReferralTrigger" NOT NULL DEFAULT 'FIRST_PURCHASE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_verification',
    "firstPurchaseMade" BOOLEAN NOT NULL DEFAULT false,
    "rewardApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT,
    "availability" "DriverStatus" NOT NULL DEFAULT 'OFFLINE',
    "currentLocation" TEXT,
    "phone" TEXT NOT NULL,
    "deliveryPartnerId" TEXT,
    "vehicleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "color" TEXT,
    "type" "VehicleType" NOT NULL DEFAULT 'CAR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_connection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "EcommercePlatform" NOT NULL,
    "storeUrl" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "accessToken" TEXT,
    "webhookSecret" TEXT,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncInterval" INTEGER,
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "syncDirection" "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "enabledSyncTypes" "EntitySyncType"[],
    "defaultLocationId" TEXT,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_sync_log" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "syncType" "EntitySyncType" NOT NULL,
    "syncDirection" "SyncDirection" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "details" JSONB,
    "triggeredBy" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ecommerce_sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_product_mapping" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "externalProductId" TEXT NOT NULL,
    "externalVariantId" TEXT,
    "externalSku" TEXT,
    "syncInventory" BOOLEAN NOT NULL DEFAULT true,
    "syncPrice" BOOLEAN NOT NULL DEFAULT true,
    "syncStatus" BOOLEAN NOT NULL DEFAULT true,
    "externalData" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ecommerce_product_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_order_mapping" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "externalOrderNumber" TEXT,
    "inventorySynced" BOOLEAN NOT NULL DEFAULT false,
    "fulfillmentSynced" BOOLEAN NOT NULL DEFAULT false,
    "externalData" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ecommerce_order_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_customer_mapping" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "externalCustomerId" TEXT NOT NULL,
    "externalEmail" TEXT,
    "externalData" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ecommerce_customer_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_webhook_log" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ecommerce_webhook_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "sessionId" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL DEFAULT 'base',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "expenseNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(19,4) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "exchangeRate" DECIMAL(19,6) NOT NULL DEFAULT 1.0,
    "baseAmount" DECIMAL(19,4),
    "taxAmount" DECIMAL(19,4),
    "taxRate" DECIMAL(65,30) DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "ledgerAccountId" TEXT,
    "costCenterId" TEXT,
    "projectId" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "isReimbursable" BOOLEAN NOT NULL DEFAULT false,
    "isBillable" BOOLEAN NOT NULL DEFAULT false,
    "purchaseId" TEXT,
    "supplierId" TEXT,
    "locationId" TEXT,
    "budgetId" TEXT,
    "customerId" TEXT,
    "businessAccountId" TEXT,
    "pettyCashFundId" TEXT,
    "utilityAccountId" TEXT,
    "memberId" TEXT NOT NULL,
    "approverId" TEXT,
    "approvalDate" TIMESTAMP(3),
    "approvalRequestId" TEXT,
    "recurringExpenseId" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "mileage" DOUBLE PRECISION,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "glCode" TEXT,
    "ledgerAccountId" TEXT,
    "taxRateDefault" DECIMAL(65,30) DEFAULT 0,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "defaultBudget" DECIMAL(19,4),
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "categoryId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supplierId" TEXT,
    "customerId" TEXT,
    "businessAccountId" TEXT,
    "utilityAccountId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "committedAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "spentAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "variance" DECIMAL(19,4),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "fiscalYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "locationId" TEXT,
    "departmentId" TEXT,
    "costCenterId" TEXT,
    "expenseCategoryId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetReport" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalSpent" DECIMAL(19,4) NOT NULL,
    "remaining" DECIMAL(19,4) NOT NULL,
    "variance" DECIMAL(19,4) NOT NULL,
    "notes" TEXT,
    "generatedById" TEXT NOT NULL,

    CONSTRAINT "BudgetReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAlert" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "threshold" DECIMAL(5,2) NOT NULL,
    "recipients" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastNotifiedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashFund" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "floatAmount" DECIMAL(19,4) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "organizationId" TEXT NOT NULL,
    "responsibleMemberId" TEXT NOT NULL,
    "locationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashTransaction" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "type" "PettyCashTransactionType" NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "description" TEXT,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "accountNumber" TEXT NOT NULL,
    "meterNumber" TEXT,
    "type" "UtilityType" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "purchaseNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "exchangeRate" DECIMAL(19,6) NOT NULL DEFAULT 1.0,
    "subTotal" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "discount" DECIMAL(19,4) DEFAULT 0,
    "shippingCost" DECIMAL(19,4) DEFAULT 0,
    "totalTaxAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(19,4) NOT NULL,
    "landedCost" DECIMAL(19,4) DEFAULT 0,
    "paidAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'ORDERED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "matchStatus" "ThreeWayMatchStatus" NOT NULL DEFAULT 'NO_MATCH',
    "notifyBeforeDays" INTEGER,
    "notes" TEXT,
    "approvalRequestId" TEXT,
    "stockRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "orderedQuantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "rejectedQuantity" INTEGER NOT NULL DEFAULT 0,
    "invoicedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(19,4) NOT NULL,
    "taxRateId" TEXT,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "landedCost" DECIMAL(19,4) DEFAULT 0,
    "totalCost" DECIMAL(19,4) NOT NULL,
    "glCode" TEXT,
    "orderedUnitId" TEXT,
    "orderedOrgUnitId" TEXT,
    "qualityCheckStatus" "QualityCheckStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasePayment" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "postingDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "subTotal" DECIMAL(19,4) NOT NULL,
    "taxAmount" DECIMAL(19,4) NOT NULL,
    "totalAmount" DECIMAL(19,4) NOT NULL,
    "amountPaid" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "matchStatus" "ThreeWayMatchStatus" NOT NULL DEFAULT 'NO_MATCH',
    "notes" TEXT,
    "invoiceUrl" TEXT,
    "etrNumber" TEXT,
    "kraCompliant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturn" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "totalValue" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "PurchaseReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnItem" (
    "id" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "purchaseItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(19,4) NOT NULL,
    "totalRefund" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestType" "ApprovalRequestType" NOT NULL,
    "relatedId" TEXT NOT NULL,
    "relatedRecordNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "scrymeThreadId" TEXT,
    "workflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDecision" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "decisionDate" TIMESTAMP(3),
    "scrymeMessageId" TEXT,
    "scrymeChannelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "settings" JSONB,
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerEvent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflowStep" (
    "id" TEXT NOT NULL,
    "approvalWorkflowId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slaHours" INTEGER,
    "allConditionsMustMatch" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStepCondition" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "type" "ConditionType" NOT NULL,
    "minAmount" DECIMAL(19,4),
    "maxAmount" DECIMAL(19,4),
    "locationId" TEXT,
    "expenseCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalStepCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStepAction" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "type" "ApprovalActionType" NOT NULL,
    "approverRole" "MemberRole",
    "specificMemberId" TEXT,
    "windmillScriptPath" TEXT,
    "approvalMode" "ApprovalMode" NOT NULL DEFAULT 'ANY_ONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalStepAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "AccountType" NOT NULL,
    "subType" "AccountSubType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postingDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "sourceType" "JournalSource",
    "sourceId" TEXT,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "ledgerAccountId" TEXT NOT NULL,
    "description" TEXT,
    "debit" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "credit" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "bankStatementLineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "accountNumber" TEXT NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "openingBalance" DECIMAL(19,4) NOT NULL,
    "closingBalance" DECIMAL(19,4) NOT NULL,
    "status" "BankReconciliationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatementLine" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'UNMATCHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankStatementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringBill" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "frequency" "RecurrenceFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "taxRateId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "huly_configuration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceSlug" TEXT,
    "workspaceUrl" TEXT,
    "apiKey" TEXT,
    "connectionMode" "HulyConnectionMode" NOT NULL DEFAULT 'REST',
    "defaultChannelId" TEXT,
    "defaultChannelName" TEXT,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncMembers" BOOLEAN NOT NULL DEFAULT false,
    "syncInterval" INTEGER NOT NULL DEFAULT 30,
    "lastSyncAt" TIMESTAMP(3),
    "connectionHealth" "HulyConnectionHealth" NOT NULL DEFAULT 'UNKNOWN',
    "lastHealthCheckAt" TIMESTAMP(3),
    "connectionError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "huly_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "huly_notification_rule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "eventType" "HulyEventType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "channelId" TEXT,
    "channelName" TEXT,
    "priority" "HulyNotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "template" JSONB,
    "filters" JSONB,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastFiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "huly_notification_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "huly_event_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "eventType" "HulyEventType" NOT NULL,
    "status" "HulyEventStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "hulyMessageId" TEXT,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "triggeredBy" TEXT,
    "retryOf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "huly_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "huly_channel_mapping" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "eventType" "HulyEventType" NOT NULL,
    "hulyChannelId" TEXT NOT NULL,
    "hulyChannelName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "huly_channel_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_definition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "category" "IntegrationCategory" NOT NULL,
    "authType" "AuthType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_integration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationDefinitionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "credentials" JSONB,
    "settings" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "syncMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_mapping" (
    "id" TEXT NOT NULL,
    "organizationIntegrationId" TEXT,
    "organizationId" TEXT,
    "internalEntityType" TEXT,
    "internalId" TEXT,
    "internalEntityId" TEXT,
    "externalId" TEXT NOT NULL,
    "externalEntityId" TEXT,
    "externalData" JSONB,
    "entityType" TEXT,
    "provider" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_event" (
    "id" TEXT NOT NULL,
    "organizationIntegrationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "IntegrationEventStatus" NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "integration_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "color" TEXT,
    "code" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ProductType" NOT NULL DEFAULT 'FINISHED_GOOD',
    "pointsOnPurchase" INTEGER,
    "brand" TEXT,
    "rating" DOUBLE PRECISION,
    "lowStockThreshold" INTEGER,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "detailedDescription" TEXT,
    "tags" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "defaultLocationId" TEXT,
    "loyaltyPointsOverride" INTEGER,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "attributes" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reorderPoint" INTEGER NOT NULL DEFAULT 5,
    "reorderQty" INTEGER NOT NULL DEFAULT 10,
    "lowStockAlert" BOOLEAN NOT NULL DEFAULT false,
    "buyingPrice" DECIMAL(10,2) NOT NULL,
    "wholesalePrice" DECIMAL(10,2),
    "retailPrice" DECIMAL(10,2),
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "promotionalPrice" DECIMAL(10,2),
    "pointsOnPurchase" INTEGER,
    "loyaltyPointsOverride" INTEGER,
    "baseUnitId" TEXT,
    "baseOrgUnitId" TEXT,
    "stockingUnitId" TEXT,
    "stockingOrgUnitId" TEXT,
    "defaultShelfLifeDays" INTEGER,
    "requiresExpiryTracking" BOOLEAN NOT NULL DEFAULT true,
    "expiryWarningDays" INTEGER DEFAULT 2,
    "requiresSerialNumber" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_selling_unit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "variantId" TEXT NOT NULL,
    "systemUnitId" TEXT,
    "orgUnitId" TEXT,
    "retailPrice" DECIMAL(10,2),
    "wholesalePrice" DECIMAL(10,2),
    "conversionMultiplier" DECIMAL(20,10),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variant_selling_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recall" (
    "id" TEXT NOT NULL,
    "recallNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecallStatus" NOT NULL DEFAULT 'ACTIVE',
    "supplierId" TEXT,
    "stockBatchId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "website" TEXT,
    "taxId" TEXT,
    "registrationNumber" TEXT,
    "currency" TEXT,
    "categories" TEXT[],
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'low',
    "primaryContact" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "paymentTerms" TEXT,
    "paymentTermsDays" INTEGER,
    "defaultNotifyBeforeDays" INTEGER,
    "leadTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customFields" JSONB,
    "organizationId" TEXT NOT NULL,
    "customBadges" TEXT[],

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSupplier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierSku" TEXT,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "minimumOrderQuantity" INTEGER,
    "leadTimeDays" INTEGER,
    "packagingUnitId" TEXT,
    "packagingOrgUnitId" TEXT,
    "unitsPerPackage" DECIMAL(10,2),
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierDocument" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPriceHistory" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "SupplierPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "locationType" "LocationType" NOT NULL DEFAULT 'RETAIL_SHOP',
    "address" JSONB,
    "contact" JSONB,
    "capacity" JSONB,
    "settings" JSONB,
    "parentLocationId" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT,
    "organizationId" TEXT NOT NULL,
    "scrymeChannelId" TEXT,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "locationId" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION,
    "capacityUnit" "UnitType",
    "capacityUsed" DOUBLE PRECISION DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "StorageZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "unitType" "StorageUnitType" NOT NULL,
    "locationId" TEXT NOT NULL,
    "zoneId" TEXT,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "dimensionUnit" TEXT,
    "maxWeight" DOUBLE PRECISION,
    "weightUnit" TEXT,
    "capacity" DOUBLE PRECISION,
    "capacityUnit" "UnitType",
    "capacityUsed" DOUBLE PRECISION DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "StorageUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QCTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCResult" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stockBatchId" TEXT,
    "purchaseItemId" TEXT,
    "data" JSONB NOT NULL,
    "status" "QualityCheckStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QCResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_review" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoragePosition" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "storageUnitId" TEXT NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "dimensionUnit" TEXT,
    "maxWeight" DOUBLE PRECISION,
    "weightUnit" TEXT,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "StoragePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "postingDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "netTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTaxes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "kraPin" TEXT,
    "kraCompliant" BOOLEAN NOT NULL DEFAULT false,
    "etrMode" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "transactionId" TEXT,
    "templateId" TEXT,
    "templateVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "taxTemplate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KRAComplianceLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "kraPin" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "taxableAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "etrMode" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'LOGGED',
    "organizationId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KRAComplianceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SALES_INVOICE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "templateData" JSONB NOT NULL,
    "logoUrl" TEXT,
    "showLineNumbers" BOOLEAN NOT NULL DEFAULT false,
    "showTaxBreakdown" BOOLEAN NOT NULL DEFAULT true,
    "showTerms" BOOLEAN NOT NULL DEFAULT true,
    "showNotes" BOOLEAN NOT NULL DEFAULT true,
    "defaultNotes" TEXT,
    "defaultTerms" TEXT,
    "paymentTermsDay" INTEGER,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "InvoiceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "templateData" JSONB NOT NULL,
    "changesSummary" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateUsageLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "templateVersion" INTEGER,
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultTemplate" TEXT NOT NULL DEFAULT 'default',
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "logoUrl" TEXT,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "companyWebsite" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showTaxBreakdown" BOOLEAN NOT NULL DEFAULT true,
    "showTerms" BOOLEAN NOT NULL DEFAULT true,
    "showNotes" BOOLEAN NOT NULL DEFAULT true,
    "showLineNumbers" BOOLEAN NOT NULL DEFAULT false,
    "defaultTerms" TEXT,
    "defaultNotes" TEXT,
    "footerText" TEXT,
    "invoiceNumberPrefix" TEXT,
    "invoiceNumberSuffix" TEXT,
    "invoiceNumberStart" INTEGER NOT NULL DEFAULT 1,
    "invoiceNumberPadding" INTEGER NOT NULL DEFAULT 0,
    "showPoweredBy" BOOLEAN NOT NULL DEFAULT true,
    "watermarkText" TEXT,
    "enableAuditTrail" BOOLEAN NOT NULL DEFAULT false,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "pointsLabel" TEXT NOT NULL DEFAULT 'Points',
    "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 1.0,
    "expiryMonths" INTEGER,
    "tierBasis" "TierBasis" NOT NULL DEFAULT 'CURRENT_BALANCE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minPoints" INTEGER NOT NULL DEFAULT 0,
    "multiplier" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyRule" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" "LoyaltyRuleType" NOT NULL,
    "pointsValue" INTEGER NOT NULL DEFAULT 0,
    "currencyAmount" DECIMAL(12,2),
    "categoryId" TEXT,
    "productId" TEXT,
    "variantId" TEXT,
    "minOrderValue" DECIMAL(12,2),
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rewardType" "LoyaltyRewardType" NOT NULL,
    "pointsRequired" INTEGER NOT NULL,
    "discountValue" DECIMAL(12,2),
    "productId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "rewardId" TEXT,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "metaTitle" TEXT,
    "defaultPriority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_dispatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "recipientIds" TEXT[],
    "recipientRoles" TEXT[],
    "recipientDepts" TEXT[],
    "data" JSONB,
    "finalContent" TEXT,
    "finalSubject" TEXT,
    "channels" TEXT[],
    "webhookUrl" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_channel_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_channel_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "taxId" TEXT,
    "registrationNumber" TEXT,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "logo" TEXT,
    "banner" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customFields" JSONB,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "defaultLocationId" TEXT,
    "defaultWarehouseId" TEXT,
    "expenseApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
    "expenseApprovalThreshold" DECIMAL(10,2),
    "pettyCashAutoApproveThreshold" DECIMAL(10,2),
    "expenseReceiptRequired" BOOLEAN NOT NULL DEFAULT true,
    "expenseReceiptThreshold" DECIMAL(10,2),
    "activeExpenseWorkflowId" TEXT,
    "defaultExpenseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "expenseTagOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_credentials" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mpesaShortCode" TEXT NOT NULL,
    "mpesaType" TEXT NOT NULL DEFAULT 'PAYBILL',
    "mpesaConsumerKey" TEXT NOT NULL,
    "mpesaConsumerSecret" TEXT NOT NULL,
    "mpesaPassKey" TEXT,
    "mpesaInitiatorPass" TEXT,
    "environment" "MpesaEnvironment" NOT NULL DEFAULT 'SANDBOX',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT,
    "pinHash" TEXT,
    "role" "MemberRole" NOT NULL,
    "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "banReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "age" TEXT,
    "gender" TEXT,
    "tags" TEXT,
    "jobTitle" TEXT,
    "employmentType" "EmploymentType",
    "joiningDate" TIMESTAMP(3),
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "managerId" TEXT,
    "isCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckInTime" TIMESTAMP(3),
    "currentCheckInLocationId" TEXT,
    "currentAttendanceLogId" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "guestExpiresAt" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'OFFLINE',

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_log" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "checkInLocationId" TEXT NOT NULL,
    "checkOutLocationId" TEXT,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "isAutoCheckout" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "permissions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_set" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "inviterId" TEXT NOT NULL,
    "departmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customRoleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roleGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isGuestInvite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "defaultTaxRate" DECIMAL(5,4),
    "inventoryPolicy" "InventoryPolicy" NOT NULL DEFAULT 'FEFO',
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "negativeStock" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT DEFAULT 'Kenya',
    "taxIntegrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "highValueTaxThreshold" DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enableCapacityTracking" BOOLEAN NOT NULL DEFAULT false,
    "enforceSpatialConstraints" BOOLEAN NOT NULL DEFAULT false,
    "enableProductDimensions" BOOLEAN NOT NULL DEFAULT false,
    "defaultDimensionUnit" TEXT,
    "defaultWeightUnit" TEXT,
    "defaultTaxId" TEXT,
    "multiAdminRoleApproval" BOOLEAN NOT NULL DEFAULT false,
    "auditLogRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "enforceMfa" BOOLEAN NOT NULL DEFAULT false,
    "enableAutoCheckout" BOOLEAN NOT NULL DEFAULT false,
    "autoCheckoutTime" TEXT,
    "enableBakerySystem" BOOLEAN NOT NULL DEFAULT false,
    "enabledPlugins" JSONB NOT NULL DEFAULT '[]',
    "defaultInvoiceTemplate" TEXT NOT NULL DEFAULT 'default',
    "defaultReceiptTemplate" TEXT NOT NULL DEFAULT 'default',
    "defaultWaybillTemplate" TEXT NOT NULL DEFAULT 'default',
    "forcePrivateAttachments" BOOLEAN NOT NULL DEFAULT false,
    "adminsCanManageStaff" BOOLEAN NOT NULL DEFAULT false,
    "mileageRate" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "supplierInvoiceReminderSchedule" INTEGER[] DEFAULT ARRAY[0, 3, 7, 14, 30]::INTEGER[],
    "priceSyncMode" "PriceSyncMode" NOT NULL DEFAULT 'MANUAL',
    "supplierSelectionStrategy" "SupplierSelection" NOT NULL DEFAULT 'PREFERRED',
    "minMarginThreshold" DECIMAL(5,2) NOT NULL DEFAULT 0.10,
    "priceApprovalThreshold" DECIMAL(5,2) NOT NULL DEFAULT 0.20,
    "telegramBotEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discordBotEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "banner" TEXT,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,
    "locationId" TEXT,
    "costCenterId" TEXT,
    "scrymeChannelId" TEXT,
    "planeProjectId" TEXT,
    "settings" JSONB,
    "customFields" JSONB,
    "headId" TEXT,
    "activeBudgetId" TEXT,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_member" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" "DepartmentMemberRole" NOT NULL DEFAULT 'MEMBER',
    "canApproveExpenses" BOOLEAN NOT NULL DEFAULT false,
    "canManageBudget" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dodo_customer_id" TEXT,
    "dodo_subscription_id" TEXT,
    "dodo_price_id" TEXT,
    "dodo_current_period_end" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_setup_token" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "locationId" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "environment" "ApiKeyEnvironment" NOT NULL DEFAULT 'LIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "redeemedApiKeyId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_setup_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_registry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "locationId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "macAddress" TEXT,
    "fingerprint" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastSeenAt" TIMESTAMP(3),
    "lastSeenIp" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "environment" "ApiKeyEnvironment" NOT NULL DEFAULT 'LIVE',
    "keyType" "ApiKeyType" NOT NULL DEFAULT 'POS',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipWhitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locationId" TEXT,
    "rateLimitTier" "RateLimitTier" NOT NULL DEFAULT 'STANDARD',
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedIp" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "data" JSONB NOT NULL,
    "summary" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plane_configuration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "workspaceSlug" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plane_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "roundingMethod" "RoundingMethod" NOT NULL DEFAULT 'NONE',
    "roundingValue" DECIMAL(10,2),
    "autoSyncWithCost" BOOLEAN NOT NULL DEFAULT false,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" "PriceApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "approvalNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "customerTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "sellingUnitId" TEXT,
    "method" "PricingMethod" NOT NULL DEFAULT 'FIXED',
    "percentageValue" DECIMAL(10,4),
    "price" DECIMAL(10,2) NOT NULL,
    "wholesalePrice" DECIMAL(10,2),
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceListId" TEXT NOT NULL,
    "variantId" TEXT,
    "categoryId" TEXT,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(10,2) NOT NULL,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingBundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "bundleType" "BundleType" NOT NULL DEFAULT 'FIXED',
    "bundlePrice" DECIMAL(10,2),
    "buyQuantity" INTEGER,
    "getQuantity" INTEGER,
    "getDiscountType" "DiscountType",
    "getDiscountValue" DECIMAL(10,2),
    "savingsLabel" TEXT,
    "imageUrl" TEXT,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PricingBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingBundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemRole" TEXT,
    "priceOverride" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingBundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "priceListItemId" TEXT NOT NULL,
    "previousPrice" DECIMAL(10,2) NOT NULL,
    "newPrice" DECIMAL(10,2) NOT NULL,
    "previousMethod" "PricingMethod",
    "newMethod" "PricingMethod",
    "changeReason" TEXT,
    "changeType" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceImportJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_change_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "priceListItemId" TEXT NOT NULL,
    "oldPrice" DECIMAL(10,2) NOT NULL,
    "newPrice" DECIMAL(10,2) NOT NULL,
    "oldCost" DECIMAL(10,2) NOT NULL,
    "newCost" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" "PriceChangeStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "price_change_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scryme_configuration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "workspaceSlug" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scryme_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scryme_messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceSlug" TEXT NOT NULL,
    "channelSlug" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "content" TEXT,
    "senderId" TEXT,
    "recipientId" TEXT,
    "eventType" TEXT,
    "relatedId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scryme_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standalone_setup_key" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standalone_setup_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standalone_device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assignedId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "fingerprint" TEXT,
    "serialNumber" TEXT,
    "organizationId" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standalone_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standalone_device_key" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standalone_device_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_rule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "locationId" TEXT NOT NULL,
    "minQuantity" DECIMAL(10,2) NOT NULL,
    "maxQuantity" DECIMAL(10,2) NOT NULL,
    "reorderQuantity" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerate" BOOLEAN NOT NULL DEFAULT false,
    "preferredSupplierId" TEXT,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "safetyStockDays" INTEGER NOT NULL DEFAULT 3,
    "lastTriggeredAt" TIMESTAMP(3),
    "lastOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reorder_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_alert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reorderRuleId" TEXT NOT NULL,
    "alertDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStock" DECIMAL(10,2) NOT NULL,
    "requiredStock" DECIMAL(10,2) NOT NULL,
    "suggestedOrder" DECIMAL(10,2) NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "purchaseId" TEXT,
    "notes" TEXT,

    CONSTRAINT "reorder_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_audit_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "stock_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_approval_chain" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minAmount" DECIMAL(19,4),
    "maxAmount" DECIMAL(19,4),
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_approval_chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_approval_step" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "alternateApproverIds" TEXT[],
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveAfter" INTEGER,

    CONSTRAINT "purchase_approval_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_take" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stockTakeNumber" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" "StockTakeStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_take_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_take_item" (
    "id" TEXT NOT NULL,
    "stockTakeId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "systemQuantity" DECIMAL(10,2) NOT NULL,
    "countedQuantity" DECIMAL(10,2),
    "variance" DECIMAL(10,2),
    "stockBatchId" TEXT,
    "notes" TEXT,
    "photoUrls" TEXT[],
    "countedAt" TIMESTAMP(3),

    CONSTRAINT "stock_take_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_performance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "onTimeDeliveries" INTEGER NOT NULL DEFAULT 0,
    "lateDeliveries" INTEGER NOT NULL DEFAULT 0,
    "avgLeadTimeDays" DECIMAL(5,2),
    "totalItemsReceived" INTEGER NOT NULL DEFAULT 0,
    "rejectedItems" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DECIMAL(5,2),
    "totalSpend" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "avgOrderValue" DECIMAL(19,4),
    "returnCount" INTEGER NOT NULL DEFAULT 0,
    "returnValue" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "overallScore" DECIMAL(3,2),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_valuation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT,
    "method" "ValuationMethod" NOT NULL DEFAULT 'FIFO',
    "totalQuantity" DECIMAL(10,2) NOT NULL,
    "totalValue" DECIMAL(19,4) NOT NULL,
    "reportData" JSONB NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_valuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CycleCountConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "AutomationFrequency" NOT NULL,
    "cronExpression" TEXT,
    "locationId" TEXT,
    "categoryId" TEXT,
    "includeABC" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CycleCountConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "variantId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "supplierBatchNumber" TEXT,
    "purchaseItemId" TEXT,
    "locationId" TEXT NOT NULL,
    "qualityCheckStatus" "QualityCheckStatus" NOT NULL DEFAULT 'PENDING',
    "storageUnitId" TEXT,
    "positionId" TEXT,
    "initialQuantity" DECIMAL(10,2) NOT NULL,
    "currentQuantity" DECIMAL(10,2) NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systemUnitId" TEXT,
    "orgUnitId" TEXT,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT,
    "landedCost" DECIMAL(10,2),
    "batchSalePrice" DECIMAL(10,2),
    "productionBatchId" TEXT,
    "parentId" TEXT,
    "assemblyId" TEXT,
    "isQuarantined" BOOLEAN NOT NULL DEFAULT false,
    "quarantineReason" TEXT,
    "isRecalled" BOOLEAN NOT NULL DEFAULT false,
    "recallId" TEXT,

    CONSTRAINT "StockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReceipt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "documentUrls" TEXT[],

    CONSTRAINT "StockReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "currentStock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reservedStock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "availableStock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reorderPoint" DECIMAL(10,2) NOT NULL DEFAULT 5,
    "reorderQty" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ProductVariantStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerialNumber" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stockBatchId" TEXT,
    "locationId" TEXT,
    "status" "SerialNumberStatus" NOT NULL DEFAULT 'IN_STOCK',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SerialNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stockBatchId" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "movementType" "MovementType" NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "adjustmentId" TEXT,
    "memberId" TEXT NOT NULL,
    "notes" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stockReceiptId" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stockBatchId" TEXT,
    "locationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "reason" "StockAdjustmentReason" NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'APPROVED',
    "notes" TEXT,
    "adjustmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referenceNumber" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_assembly" (
    "id" TEXT NOT NULL,
    "assemblyNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variantId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "status" "AssemblyStatus" NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_assembly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_assembly_item" (
    "id" TEXT NOT NULL,
    "assemblyId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "stockBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_assembly_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT NOT NULL,
    "status" "StockRequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "StockRequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "justification" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" TIMESTAMP(3),
    "fulfilledDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "totalEstimatedCost" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "stock_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_request_item" (
    "id" TEXT NOT NULL,
    "stockRequestId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "requestedQuantity" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "unitCostAtRequest" DECIMAL(10,2) NOT NULL,
    "allocatedQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fulfilledQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "stock_request_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_item" (
    "id" TEXT NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stockBatchId" TEXT,
    "requestedQuantity" DECIMAL(10,2) NOT NULL,
    "shippedQuantity" DECIMAL(10,2),
    "receivedQuantity" DECIMAL(10,2),
    "unitCost" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "stock_transfer_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "priority" "StockRequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "rejectionReason" TEXT,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "shippingCost" DECIMAL(10,2),
    "estimatedArrival" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "qualityCheckStatus" "QualityCheckStatus" NOT NULL DEFAULT 'PENDING',
    "qualityCheckNotes" TEXT,
    "qualityCheckedById" TEXT,
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "shippedById" TEXT,
    "receivedById" TEXT,
    "stockRequestId" TEXT,

    CONSTRAINT "stock_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_report_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "StockReportCategory" NOT NULL,
    "type" "StockReportType" NOT NULL,
    "frequency" "ReportFrequency" NOT NULL DEFAULT 'ON_DEMAND',
    "columns" JSONB NOT NULL,
    "parametersConfig" JSONB NOT NULL,
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByMemberId" TEXT,

    CONSTRAINT "stock_report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_stock_reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parametersUsed" JSONB NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "fileSize" TEXT,
    "summary" TEXT,
    "data" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "generatedById" TEXT NOT NULL,

    CONSTRAINT "generated_stock_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_automations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "frequency" "AutomationFrequency" NOT NULL,
    "cronExpression" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "timeOfDay" TEXT,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "status" "AutomationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastError" TEXT,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "report_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_automation_executions" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "channelId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "reportId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "triggeredBy" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_channels" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ReportChannelType" NOT NULL,
    "status" "ReportChannelStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" "MemberRole"[],
    "lastUsedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReconciliation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reconciliationDate" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "expectedValue" DECIMAL(10,2) NOT NULL,
    "actualValue" DECIMAL(10,2) NOT NULL,
    "varianceValue" DECIMAL(10,2) NOT NULL,
    "variancePercent" DECIMAL(5,2),
    "initiatedBy" TEXT,
    "completedBy" TEXT,
    "reviewedBy" TEXT,
    "photoUrls" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "expectedQuantity" DECIMAL(10,2) NOT NULL,
    "actualQuantity" DECIMAL(10,2) NOT NULL,
    "varianceQuantity" DECIMAL(10,2) NOT NULL,
    "expectedValue" DECIMAL(10,2) NOT NULL,
    "actualValue" DECIMAL(10,2) NOT NULL,
    "varianceValue" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "resolutionType" TEXT,
    "resolutionNotes" TEXT,
    "adjustmentCreated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovementReconciliationLink" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "relevanceScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovementReconciliationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionAuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "denialReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_authority" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "agencyCode" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "address" JSONB,
    "filingInstructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_authority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "taxType" "TaxType" NOT NULL DEFAULT 'VAT',
    "taxAuthorityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_filing" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "filingNumber" TEXT NOT NULL,
    "taxAuthorityId" TEXT NOT NULL,
    "periodStartDate" TIMESTAMP(3) NOT NULL,
    "periodEndDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "filedDate" TIMESTAMP(3),
    "totalSales" DECIMAL(12,2) NOT NULL,
    "taxableAmount" DECIMAL(12,2) NOT NULL,
    "totalTaxOwed" DECIMAL(12,2) NOT NULL,
    "totalTaxPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "FilingStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "confirmationNumber" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_filing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_payment" (
    "id" TEXT NOT NULL,
    "filingId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_tax" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "taxRateId" TEXT,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_expense_tax" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_expense_tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_purchase_tax" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "taxRateId" TEXT,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_purchase_tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "channel" "TransactionChannel" NOT NULL DEFAULT 'POS_TERMINAL',
    "status" "TransactionStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "businessAccountId" TEXT,
    "deliveryPartnerId" TEXT,
    "memberId" TEXT,
    "locationId" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "finalTotal" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "baseCurrencyTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "termsAndConditions" TEXT,
    "parentTransactionId" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "receiptUrl" TEXT,
    "metadata" JSONB,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_item" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "listPrice" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "sellingUnitId" TEXT,
    "sellingOrgUnitId" TEXT,
    "notes" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_allocation" (
    "id" TEXT NOT NULL,
    "transactionItemId" TEXT NOT NULL,
    "stockBatchId" TEXT NOT NULL,
    "inventoryLocationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "organizationId" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "amountReceived" DECIMAL(12,2),
    "change" DECIMAL(12,2),
    "gatewayTxnId" TEXT,
    "gatewayResponse" JSONB,
    "gatewayCurrencyCode" TEXT DEFAULT 'KES',
    "gatewayAmount" DECIMAL(12,2),
    "gatewayFee" DECIMAL(12,2),
    "payerPhone" TEXT,
    "payerName" TEXT,
    "payoutId" TEXT,
    "referenceNumber" TEXT,
    "cashDrawerId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "chequeDate" TIMESTAMP(3),
    "bankName" TEXT,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unclaimed_payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "transId" TEXT NOT NULL,
    "transTime" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "shortCode" TEXT NOT NULL,
    "billRefNumber" TEXT,
    "invoiceNumber" TEXT,
    "msisdn" TEXT NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "claimedByUserId" TEXT,
    "paymentId" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unclaimed_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waybill_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waybill_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "expectedAmount" DECIMAL(12,2) NOT NULL,
    "actualAmount" DECIMAL(12,2) NOT NULL,
    "totalFees" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "expectedAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" "FulfillmentType" NOT NULL,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "shippingAddressId" TEXT,
    "billingAddressId" TEXT,
    "pickupLocationId" TEXT,
    "driverId" TEXT,
    "quantityHandedOver" INTEGER,
    "quantityDelivered" INTEGER,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "deliveryNotes" TEXT,
    "podType" "PodType" NOT NULL DEFAULT 'DIGITAL_APP',
    "proofOfDeliveryUrl" TEXT,
    "receivedBy" TEXT,
    "confirmationToken" TEXT,
    "confirmedByCustomerAt" TIMESTAMP(3),
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "preparedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_item" (
    "id" TEXT NOT NULL,
    "fulfillmentId" TEXT NOT NULL,
    "transactionItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_discount" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionItemId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reason" "ReturnReason" NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "refundAmount" DECIMAL(12,2) NOT NULL,
    "restockFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "memberId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_item" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "transactionItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" "ReturnReason",
    "status" "ReturnItemStatus" NOT NULL DEFAULT 'PENDING',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "refundAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "return_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "shortCode" TEXT,
    "shortUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sizeBytes" INTEGER,
    "description" TEXT,
    "content" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "documentMemberId" TEXT,
    "transactionId" TEXT,
    "paymentId" TEXT,
    "purchaseId" TEXT,
    "expenseId" TEXT,
    "stockBatchId" TEXT,
    "fulfillmentId" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashDrawer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT,
    "memberId" TEXT NOT NULL,
    "openingAmount" DECIMAL(10,2) NOT NULL,
    "closingAmount" DECIMAL(10,2),
    "expectedAmount" DECIMAL(10,2),
    "discrepancy" DECIMAL(10,2),
    "discrepancyReason" TEXT,
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "status" "DrawerStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "CashDrawer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "memberId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "action" "AuditLogAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" "AuditLogStatus" NOT NULL DEFAULT 'SUCCESS',
    "severity" "AuditLogSeverity" NOT NULL DEFAULT 'INFO',
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpesaPaymentRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "paymentId" TEXT,
    "checkoutRequestId" TEXT NOT NULL,
    "merchantRequestId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resultCode" INTEGER,
    "resultDescription" TEXT,
    "mpesaReceiptNumber" TEXT,
    "transactionDate" TIMESTAMP(3),
    "saleData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "saleNumber" TEXT,

    CONSTRAINT "MpesaPaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_unit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "abbreviation" TEXT,
    "pluralName" TEXT,
    "type" "UnitType" NOT NULL,
    "category" "IndustryCategory" NOT NULL DEFAULT 'UNIVERSAL',
    "isBaseUnit" BOOLEAN NOT NULL DEFAULT false,
    "isMetric" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,

    CONSTRAINT "system_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_unit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "abbreviation" TEXT,
    "pluralName" TEXT,
    "type" "UnitType" NOT NULL,
    "category" "IndustryCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "baseSystemUnitId" TEXT,
    "conversionFactor" DECIMAL(20,10),
    "conversionOffset" DECIMAL(20,10) DEFAULT 0,

    CONSTRAINT "organization_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_unit_conversion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromUnitId" TEXT NOT NULL,
    "toUnitId" TEXT NOT NULL,
    "factor" DECIMAL(20,10) NOT NULL,
    "offset" DECIMAL(20,10) NOT NULL DEFAULT 0,
    "isApproximate" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "org_unit_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_conversion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fromUnitId" TEXT NOT NULL,
    "toUnitId" TEXT NOT NULL,
    "factor" DECIMAL(20,10) NOT NULL,
    "offset" DECIMAL(20,10) NOT NULL DEFAULT 0,
    "isApproximate" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "unit_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_unit_conversion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "fromUnitId" TEXT NOT NULL,
    "toUnitId" TEXT NOT NULL,
    "factor" DECIMAL(20,10) NOT NULL,
    "offset" DECIMAL(20,10) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_unit_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "businessAccountId" TEXT,
    "type" "AddressType" NOT NULL DEFAULT 'BOTH',
    "label" TEXT,
    "street1" TEXT NOT NULL,
    "street2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_api_client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scopes" TEXT[] DEFAULT ARRAY['read', 'write']::TEXT[],
    "corsOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "businessAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v3_api_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscription" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "apiClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_log" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "error" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "nextAttemptAt" TIMESTAMP(3),
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "windmill_configuration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "windmillBaseUrl" TEXT NOT NULL DEFAULT 'http://windmill:8000',
    "windmillApiKey" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "workspaceId" TEXT,
    "workspaceName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "windmill_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "windmill_workflow" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "settings" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "windmill_workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "windmill_execution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "scriptPath" TEXT NOT NULL,
    "dealioEventType" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "status" "WindmillExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "error" TEXT,
    "summary" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "windmill_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zitadel_configuration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "zitadelOrgId" TEXT,
    "zitadelProjectId" TEXT,
    "zitadelAppId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoSyncOnRegister" BOOLEAN NOT NULL DEFAULT true,
    "autoSyncOnSignIn" BOOLEAN NOT NULL DEFAULT false,
    "syncToTwentyCrm" BOOLEAN NOT NULL DEFAULT true,
    "syncToErpCustomer" BOOLEAN NOT NULL DEFAULT true,
    "connectionStatus" "ZitadelConnectionStatus" NOT NULL DEFAULT 'UNKNOWN',
    "connectionError" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "totalUsersSynced" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zitadel_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zitadel_webhook_log" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "zitadelUserId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "ZitadelWebhookStatus" NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zitadel_webhook_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssistantBakerBatches" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssistantBakerBatches_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TemplateAssistantBakers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TemplateAssistantBakers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CustomerToPriceList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CustomerToPriceList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BusinessAccountToPriceList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BusinessAccountToPriceList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExpenseApprovalWorkflows" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExpenseApprovalWorkflows_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_VariantQCTemplates" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VariantQCTemplates_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MemberRoleGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemberRoleGroups_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MemberCustomRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemberCustomRoles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RoleGroupPermissionSets" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleGroupPermissionSets_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MovementSerialNumbers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MovementSerialNumbers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AutomationChannels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AutomationChannels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_referralCode_key" ON "user"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "api_key_usage_log_apiKeyId_idx" ON "api_key_usage_log"("apiKeyId");

-- CreateIndex
CREATE INDEX "api_key_usage_log_timestamp_idx" ON "api_key_usage_log"("timestamp");

-- CreateIndex
CREATE INDEX "api_key_usage_log_endpoint_idx" ON "api_key_usage_log"("endpoint");

-- CreateIndex
CREATE INDEX "api_key_usage_log_organizationId_idx" ON "api_key_usage_log"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_client_clientId_key" ON "oauth_client"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_refresh_token_token_key" ON "oauth_refresh_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_access_token_token_key" ON "oauth_access_token"("token");

-- CreateIndex
CREATE INDEX "bakery_category_organizationId_idx" ON "bakery_category"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "bakery_category_organizationId_name_key" ON "bakery_category"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_producesVariantId_key" ON "Recipe"("producesVariantId");

-- CreateIndex
CREATE INDEX "Recipe_organizationId_categoryId_idx" ON "Recipe"("organizationId", "categoryId");

-- CreateIndex
CREATE INDEX "Recipe_categoryId_idx" ON "Recipe"("categoryId");

-- CreateIndex
CREATE INDEX "Recipe_organizationId_difficulty_idx" ON "Recipe"("organizationId", "difficulty");

-- CreateIndex
CREATE INDEX "Recipe_systemUnitId_idx" ON "Recipe"("systemUnitId");

-- CreateIndex
CREATE INDEX "Recipe_orgUnitId_idx" ON "Recipe"("orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_organizationId_name_key" ON "Recipe"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_id_organizationId_key" ON "Recipe"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Batch_organizationId_scheduledStartAt_idx" ON "Batch"("organizationId", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "Batch_organizationId_status_scheduledStartAt_idx" ON "Batch"("organizationId", "status", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "Batch_organizationId_expirationStatus_expiresAt_idx" ON "Batch"("organizationId", "expirationStatus", "expiresAt");

-- CreateIndex
CREATE INDEX "Batch_recipeId_idx" ON "Batch"("recipeId");

-- CreateIndex
CREATE INDEX "Batch_leadBakerId_idx" ON "Batch"("leadBakerId");

-- CreateIndex
CREATE INDEX "Batch_createdFromTemplateId_idx" ON "Batch"("createdFromTemplateId");

-- CreateIndex
CREATE INDEX "Batch_systemUnitId_idx" ON "Batch"("systemUnitId");

-- CreateIndex
CREATE INDEX "Batch_orgUnitId_idx" ON "Batch"("orgUnitId");

-- CreateIndex
CREATE INDEX "Batch_expiresAt_idx" ON "Batch"("expiresAt");

-- CreateIndex
CREATE INDEX "Batch_outputLocationId_expirationStatus_idx" ON "Batch"("outputLocationId", "expirationStatus");

-- CreateIndex
CREATE INDEX "Batch_status_scheduledStartAt_idx" ON "Batch"("status", "scheduledStartAt");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_id_organizationId_key" ON "Batch"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_organizationId_batchNumber_key" ON "Batch"("organizationId", "batchNumber");

-- CreateIndex
CREATE INDEX "Template_recipeId_idx" ON "Template"("recipeId");

-- CreateIndex
CREATE INDEX "Template_organizationId_isActive_idx" ON "Template"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Template_systemUnitId_idx" ON "Template"("systemUnitId");

-- CreateIndex
CREATE INDEX "Template_orgUnitId_idx" ON "Template"("orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_organizationId_name_key" ON "Template"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Template_id_organizationId_key" ON "Template"("id", "organizationId");

-- CreateIndex
CREATE INDEX "template_schedule_templateId_idx" ON "template_schedule"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "template_schedule_templateId_dayOfWeek_time_key" ON "template_schedule"("templateId", "dayOfWeek", "time");

-- CreateIndex
CREATE INDEX "recipe_ingredient_recipeId_idx" ON "recipe_ingredient"("recipeId");

-- CreateIndex
CREATE INDEX "recipe_ingredient_ingredientVariantId_idx" ON "recipe_ingredient"("ingredientVariantId");

-- CreateIndex
CREATE INDEX "recipe_ingredient_systemUnitId_idx" ON "recipe_ingredient"("systemUnitId");

-- CreateIndex
CREATE INDEX "recipe_ingredient_orgUnitId_idx" ON "recipe_ingredient"("orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredient_recipeId_ingredientVariantId_systemUnitId_key" ON "recipe_ingredient"("recipeId", "ingredientVariantId", "systemUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "bakery_settings_organizationId_key" ON "bakery_settings"("organizationId");

-- CreateIndex
CREATE INDEX "batch_ingredient_consumption_batchId_idx" ON "batch_ingredient_consumption"("batchId");

-- CreateIndex
CREATE INDEX "batch_ingredient_consumption_stockBatchId_idx" ON "batch_ingredient_consumption"("stockBatchId");

-- CreateIndex
CREATE INDEX "batch_ingredient_consumption_organizationId_idx" ON "batch_ingredient_consumption"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "quality_incident_incidentNumber_key" ON "quality_incident"("incidentNumber");

-- CreateIndex
CREATE INDEX "quality_incident_organizationId_idx" ON "quality_incident"("organizationId");

-- CreateIndex
CREATE INDEX "quality_incident_batchId_idx" ON "quality_incident"("batchId");

-- CreateIndex
CREATE INDEX "quality_incident_stockBatchId_idx" ON "quality_incident"("stockBatchId");

-- CreateIndex
CREATE INDEX "quality_incident_supplierId_idx" ON "quality_incident"("supplierId");

-- CreateIndex
CREATE INDEX "bakery_bakers_bakerySettingsId_idx" ON "bakery_bakers"("bakerySettingsId");

-- CreateIndex
CREATE INDEX "bakery_bakers_memberId_idx" ON "bakery_bakers"("memberId");

-- CreateIndex
CREATE INDEX "bakery_bakers_isActive_idx" ON "bakery_bakers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "bakery_bakers_bakerySettingsId_memberId_key" ON "bakery_bakers"("bakerySettingsId", "memberId");

-- CreateIndex
CREATE INDEX "delivery_partner_organizationId_idx" ON "delivery_partner"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_partner_organizationId_name_key" ON "delivery_partner"("organizationId", "name");

-- CreateIndex
CREATE INDEX "partner_wallet_log_partnerId_idx" ON "partner_wallet_log"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_workflowId_key" ON "campaigns"("workflowId");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_idx" ON "campaigns"("organizationId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaign_segments_organizationId_idx" ON "campaign_segments"("organizationId");

-- CreateIndex
CREATE INDEX "campaign_workflows_organizationId_idx" ON "campaign_workflows"("organizationId");

-- CreateIndex
CREATE INDEX "campaign_workflow_instances_workflowId_idx" ON "campaign_workflow_instances"("workflowId");

-- CreateIndex
CREATE INDEX "campaign_workflow_instances_recordId_idx" ON "campaign_workflow_instances"("recordId");

-- CreateIndex
CREATE INDEX "campaign_events_campaignId_idx" ON "campaign_events"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_events_recordId_idx" ON "campaign_events"("recordId");

-- CreateIndex
CREATE INDEX "campaign_events_type_idx" ON "campaign_events"("type");

-- CreateIndex
CREATE INDEX "crm_object_definitions_organizationId_idx" ON "crm_object_definitions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_object_definitions_organizationId_name_key" ON "crm_object_definitions"("organizationId", "name");

-- CreateIndex
CREATE INDEX "crm_field_definitions_objectId_idx" ON "crm_field_definitions"("objectId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_field_definitions_objectId_name_key" ON "crm_field_definitions"("objectId", "name");

-- CreateIndex
CREATE INDEX "crm_records_objectId_organizationId_idx" ON "crm_records"("objectId", "organizationId");

-- CreateIndex
CREATE INDEX "crm_records_organizationId_idx" ON "crm_records"("organizationId");

-- CreateIndex
CREATE INDEX "crm_relationship_definitions_organizationId_idx" ON "crm_relationship_definitions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_relationship_definitions_organizationId_name_key" ON "crm_relationship_definitions"("organizationId", "name");

-- CreateIndex
CREATE INDEX "crm_associations_sourceRecordId_idx" ON "crm_associations"("sourceRecordId");

-- CreateIndex
CREATE INDEX "crm_associations_targetRecordId_idx" ON "crm_associations"("targetRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_associations_relationshipId_sourceRecordId_targetRecord_key" ON "crm_associations"("relationshipId", "sourceRecordId", "targetRecordId");

-- CreateIndex
CREATE INDEX "crm_activities_recordId_idx" ON "crm_activities"("recordId");

-- CreateIndex
CREATE INDEX "crm_activities_organizationId_idx" ON "crm_activities"("organizationId");

-- CreateIndex
CREATE INDEX "crm_notes_recordId_idx" ON "crm_notes"("recordId");

-- CreateIndex
CREATE INDEX "crm_notes_organizationId_idx" ON "crm_notes"("organizationId");

-- CreateIndex
CREATE INDEX "crm_notes_timelineDate_idx" ON "crm_notes"("timelineDate");

-- CreateIndex
CREATE INDEX "crm_follow_ups_recordId_idx" ON "crm_follow_ups"("recordId");

-- CreateIndex
CREATE INDEX "crm_follow_ups_organizationId_idx" ON "crm_follow_ups"("organizationId");

-- CreateIndex
CREATE INDEX "crm_follow_ups_assignedToId_idx" ON "crm_follow_ups"("assignedToId");

-- CreateIndex
CREATE INDEX "crm_follow_ups_locationId_idx" ON "crm_follow_ups"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_crmRecordId_key" ON "Customer"("crmRecordId");

-- CreateIndex
CREATE INDEX "Customer_email_organizationId_idx" ON "Customer"("email", "organizationId");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_email_key" ON "Customer"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "business_account_crmRecordId_key" ON "business_account"("crmRecordId");

-- CreateIndex
CREATE INDEX "business_account_organizationId_idx" ON "business_account"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "B2BConnection_apiKey_key" ON "B2BConnection"("apiKey");

-- CreateIndex
CREATE INDEX "B2BConnection_apiKey_idx" ON "B2BConnection"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "B2BConnection_supplierOrgId_businessAccountId_key" ON "B2BConnection"("supplierOrgId", "businessAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_program_organizationId_name_key" ON "referral_program"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "referral_refereeId_key" ON "referral"("refereeId");

-- CreateIndex
CREATE INDEX "referral_referrerId_idx" ON "referral"("referrerId");

-- CreateIndex
CREATE INDEX "referral_refereeId_idx" ON "referral"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "driver_memberId_key" ON "driver"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "driver_vehicleId_key" ON "driver"("vehicleId");

-- CreateIndex
CREATE INDEX "driver_organizationId_idx" ON "driver"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_licensePlate_key" ON "vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicle_organizationId_idx" ON "vehicle"("organizationId");

-- CreateIndex
CREATE INDEX "ecommerce_connection_organizationId_idx" ON "ecommerce_connection"("organizationId");

-- CreateIndex
CREATE INDEX "ecommerce_connection_platform_idx" ON "ecommerce_connection"("platform");

-- CreateIndex
CREATE INDEX "ecommerce_connection_isActive_idx" ON "ecommerce_connection"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_connection_organizationId_storeUrl_key" ON "ecommerce_connection"("organizationId", "storeUrl");

-- CreateIndex
CREATE INDEX "ecommerce_sync_log_connectionId_idx" ON "ecommerce_sync_log"("connectionId");

-- CreateIndex
CREATE INDEX "ecommerce_sync_log_syncType_status_idx" ON "ecommerce_sync_log"("syncType", "status");

-- CreateIndex
CREATE INDEX "ecommerce_sync_log_startedAt_idx" ON "ecommerce_sync_log"("startedAt");

-- CreateIndex
CREATE INDEX "ecommerce_sync_log_organizationId_idx" ON "ecommerce_sync_log"("organizationId");

-- CreateIndex
CREATE INDEX "ecommerce_product_mapping_productId_idx" ON "ecommerce_product_mapping"("productId");

-- CreateIndex
CREATE INDEX "ecommerce_product_mapping_variantId_idx" ON "ecommerce_product_mapping"("variantId");

-- CreateIndex
CREATE INDEX "ecommerce_product_mapping_connectionId_idx" ON "ecommerce_product_mapping"("connectionId");

-- CreateIndex
CREATE INDEX "ecommerce_product_mapping_organizationId_idx" ON "ecommerce_product_mapping"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_product_mapping_connectionId_externalProductId_ex_key" ON "ecommerce_product_mapping"("connectionId", "externalProductId", "externalVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_order_mapping_transactionId_key" ON "ecommerce_order_mapping"("transactionId");

-- CreateIndex
CREATE INDEX "ecommerce_order_mapping_transactionId_idx" ON "ecommerce_order_mapping"("transactionId");

-- CreateIndex
CREATE INDEX "ecommerce_order_mapping_connectionId_idx" ON "ecommerce_order_mapping"("connectionId");

-- CreateIndex
CREATE INDEX "ecommerce_order_mapping_organizationId_idx" ON "ecommerce_order_mapping"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_order_mapping_connectionId_externalOrderId_key" ON "ecommerce_order_mapping"("connectionId", "externalOrderId");

-- CreateIndex
CREATE INDEX "ecommerce_customer_mapping_customerId_idx" ON "ecommerce_customer_mapping"("customerId");

-- CreateIndex
CREATE INDEX "ecommerce_customer_mapping_connectionId_idx" ON "ecommerce_customer_mapping"("connectionId");

-- CreateIndex
CREATE INDEX "ecommerce_customer_mapping_organizationId_idx" ON "ecommerce_customer_mapping"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_customer_mapping_connectionId_externalCustomerId_key" ON "ecommerce_customer_mapping"("connectionId", "externalCustomerId");

-- CreateIndex
CREATE INDEX "ecommerce_webhook_log_connectionId_topic_idx" ON "ecommerce_webhook_log"("connectionId", "topic");

-- CreateIndex
CREATE INDEX "ecommerce_webhook_log_status_idx" ON "ecommerce_webhook_log"("status");

-- CreateIndex
CREATE INDEX "ecommerce_webhook_log_receivedAt_idx" ON "ecommerce_webhook_log"("receivedAt");

-- CreateIndex
CREATE INDEX "ecommerce_webhook_log_organizationId_idx" ON "ecommerce_webhook_log"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_sessionId_key" ON "Cart"("sessionId");

-- CreateIndex
CREATE INDEX "Cart_organizationId_customerId_idx" ON "Cart"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Cart_sessionId_idx" ON "Cart"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key" ON "CartItem"("cartId", "productId", "variantId");

-- CreateIndex
CREATE INDEX "favorites_organizationId_idx" ON "favorites"("organizationId");

-- CreateIndex
CREATE INDEX "favorites_customerId_idx" ON "favorites"("customerId");

-- CreateIndex
CREATE INDEX "favorites_productId_idx" ON "favorites"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_customerId_productId_key" ON "favorites"("customerId", "productId");

-- CreateIndex
CREATE INDEX "product_reviews_organizationId_idx" ON "product_reviews"("organizationId");

-- CreateIndex
CREATE INDEX "product_reviews_customerId_idx" ON "product_reviews"("customerId");

-- CreateIndex
CREATE INDEX "product_reviews_productId_idx" ON "product_reviews"("productId");

-- CreateIndex
CREATE INDEX "product_reviews_isVisible_idx" ON "product_reviews"("isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_approvalRequestId_key" ON "Expense"("approvalRequestId");

-- CreateIndex
CREATE INDEX "Expense_organizationId_status_expenseDate_idx" ON "Expense"("organizationId", "status", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_memberId_status_idx" ON "Expense"("memberId", "status");

-- CreateIndex
CREATE INDEX "Expense_categoryId_expenseDate_idx" ON "Expense"("categoryId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_deletedAt_idx" ON "Expense"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_organizationId_expenseNumber_key" ON "Expense"("organizationId", "expenseNumber");

-- CreateIndex
CREATE INDEX "ExpenseCategory_organizationId_idx" ON "ExpenseCategory"("organizationId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_glCode_idx" ON "ExpenseCategory"("glCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_organizationId_name_key" ON "ExpenseCategory"("organizationId", "name");

-- CreateIndex
CREATE INDEX "RecurringExpense_organizationId_idx" ON "RecurringExpense"("organizationId");

-- CreateIndex
CREATE INDEX "RecurringExpense_nextDueDate_idx" ON "RecurringExpense"("nextDueDate");

-- CreateIndex
CREATE INDEX "RecurringExpense_isActive_idx" ON "RecurringExpense"("isActive");

-- CreateIndex
CREATE INDEX "Budget_fiscalYear_idx" ON "Budget"("fiscalYear");

-- CreateIndex
CREATE INDEX "Budget_departmentId_idx" ON "Budget"("departmentId");

-- CreateIndex
CREATE INDEX "Budget_organizationId_idx" ON "Budget"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_organizationId_name_periodStart_periodEnd_key" ON "Budget"("organizationId", "name", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "BudgetReport_budgetId_idx" ON "BudgetReport"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetReport_reportDate_idx" ON "BudgetReport"("reportDate");

-- CreateIndex
CREATE INDEX "BudgetAlert_budgetId_idx" ON "BudgetAlert"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetAlert_organizationId_idx" ON "BudgetAlert"("organizationId");

-- CreateIndex
CREATE INDEX "CostCenter_organizationId_idx" ON "CostCenter"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_organizationId_code_key" ON "CostCenter"("organizationId", "code");

-- CreateIndex
CREATE INDEX "PettyCashFund_organizationId_idx" ON "PettyCashFund"("organizationId");

-- CreateIndex
CREATE INDEX "PettyCashTransaction_fundId_idx" ON "PettyCashTransaction"("fundId");

-- CreateIndex
CREATE INDEX "UtilityAccount_organizationId_idx" ON "UtilityAccount"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_approvalRequestId_key" ON "Purchase"("approvalRequestId");

-- CreateIndex
CREATE INDEX "Purchase_orderDate_idx" ON "Purchase"("orderDate");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "Purchase_status_idx" ON "Purchase"("status");

-- CreateIndex
CREATE INDEX "Purchase_organizationId_idx" ON "Purchase"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_organizationId_purchaseNumber_key" ON "Purchase"("organizationId", "purchaseNumber");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseItem_variantId_idx" ON "PurchaseItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseItem_id_orderedOrgUnitId_orderedUnitId_key" ON "PurchaseItem"("id", "orderedOrgUnitId", "orderedUnitId");

-- CreateIndex
CREATE INDEX "PurchasePayment_purchaseId_idx" ON "PurchasePayment"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchasePayment_paymentDate_idx" ON "PurchasePayment"("paymentDate");

-- CreateIndex
CREATE INDEX "SupplierInvoice_status_idx" ON "SupplierInvoice"("status");

-- CreateIndex
CREATE INDEX "SupplierInvoice_organizationId_idx" ON "SupplierInvoice"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_organizationId_supplierId_invoiceNumber_key" ON "SupplierInvoice"("organizationId", "supplierId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "PurchaseReturn_purchaseId_idx" ON "PurchaseReturn"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_supplierId_idx" ON "PurchaseReturn"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturn_organizationId_returnNumber_key" ON "PurchaseReturn"("organizationId", "returnNumber");

-- CreateIndex
CREATE INDEX "PurchaseReturnItem_purchaseReturnId_idx" ON "PurchaseReturnItem"("purchaseReturnId");

-- CreateIndex
CREATE INDEX "PurchaseReturnItem_purchaseItemId_idx" ON "PurchaseReturnItem"("purchaseItemId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_organizationId_status_idx" ON "ApprovalRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_relatedId_idx" ON "ApprovalRequest"("relatedId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ApprovalDecision_approvalRequestId_idx" ON "ApprovalDecision"("approvalRequestId");

-- CreateIndex
CREATE INDEX "ApprovalDecision_approverId_status_idx" ON "ApprovalDecision"("approverId", "status");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_organizationId_isActive_idx" ON "ApprovalWorkflow"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflow_organizationId_name_key" ON "ApprovalWorkflow"("organizationId", "name");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_approvalWorkflowId_stepNumber_idx" ON "ApprovalWorkflowStep"("approvalWorkflowId", "stepNumber");

-- CreateIndex
CREATE INDEX "ApprovalStepCondition_stepId_idx" ON "ApprovalStepCondition"("stepId");

-- CreateIndex
CREATE INDEX "ApprovalStepCondition_expenseCategoryId_idx" ON "ApprovalStepCondition"("expenseCategoryId");

-- CreateIndex
CREATE INDEX "ApprovalStepAction_stepId_idx" ON "ApprovalStepAction"("stepId");

-- CreateIndex
CREATE INDEX "ApprovalStepAction_specificMemberId_idx" ON "ApprovalStepAction"("specificMemberId");

-- CreateIndex
CREATE INDEX "LedgerAccount_organizationId_idx" ON "LedgerAccount"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_organizationId_code_key" ON "LedgerAccount"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_organizationId_name_key" ON "LedgerAccount"("organizationId", "name");

-- CreateIndex
CREATE INDEX "JournalEntry_organizationId_entryDate_idx" ON "JournalEntry"("organizationId", "entryDate");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JournalLine_bankStatementLineId_key" ON "JournalLine"("bankStatementLineId");

-- CreateIndex
CREATE INDEX "JournalLine_journalEntryId_idx" ON "JournalLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalLine_ledgerAccountId_idx" ON "JournalLine"("ledgerAccountId");

-- CreateIndex
CREATE INDEX "BankStatement_organizationId_idx" ON "BankStatement"("organizationId");

-- CreateIndex
CREATE INDEX "BankStatementLine_statementId_idx" ON "BankStatementLine"("statementId");

-- CreateIndex
CREATE INDEX "RecurringBill_organizationId_idx" ON "RecurringBill"("organizationId");

-- CreateIndex
CREATE INDEX "RecurringBill_nextDueDate_idx" ON "RecurringBill"("nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "huly_configuration_organizationId_key" ON "huly_configuration"("organizationId");

-- CreateIndex
CREATE INDEX "huly_notification_rule_organizationId_idx" ON "huly_notification_rule"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "huly_notification_rule_configId_eventType_key" ON "huly_notification_rule"("configId", "eventType");

-- CreateIndex
CREATE INDEX "huly_event_log_configId_status_idx" ON "huly_event_log"("configId", "status");

-- CreateIndex
CREATE INDEX "huly_event_log_organizationId_createdAt_idx" ON "huly_event_log"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "huly_channel_mapping_organizationId_idx" ON "huly_channel_mapping"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "huly_channel_mapping_configId_eventType_key" ON "huly_channel_mapping"("configId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "integration_definition_name_key" ON "integration_definition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "integration_definition_slug_key" ON "integration_definition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_integration_organizationId_integrationDefiniti_key" ON "organization_integration"("organizationId", "integrationDefinitionId");

-- CreateIndex
CREATE INDEX "external_mapping_organizationIntegrationId_idx" ON "external_mapping"("organizationIntegrationId");

-- CreateIndex
CREATE INDEX "external_mapping_internalEntityType_internalEntityId_idx" ON "external_mapping"("internalEntityType", "internalEntityId");

-- CreateIndex
CREATE INDEX "external_mapping_internalId_idx" ON "external_mapping"("internalId");

-- CreateIndex
CREATE INDEX "external_mapping_externalId_idx" ON "external_mapping"("externalId");

-- CreateIndex
CREATE INDEX "external_mapping_organizationId_idx" ON "external_mapping"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "external_mapping_organizationId_provider_externalId_entityT_key" ON "external_mapping"("organizationId", "provider", "externalId", "entityType");

-- CreateIndex
CREATE INDEX "integration_event_organizationIntegrationId_status_idx" ON "integration_event"("organizationIntegrationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_organizationId_idx" ON "Category"("organizationId");

-- CreateIndex
CREATE INDEX "Category_organizationId_name_idx" ON "Category"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_organizationId_name_key" ON "Category"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");

-- CreateIndex
CREATE INDEX "Product_organizationId_id_idx" ON "Product"("organizationId", "id");

-- CreateIndex
CREATE INDEX "Product_defaultLocationId_idx" ON "Product"("defaultLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organizationId_barcode_key" ON "Product"("organizationId", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_barcode_key" ON "product_variant"("barcode");

-- CreateIndex
CREATE INDEX "product_variant_sku_idx" ON "product_variant"("sku");

-- CreateIndex
CREATE INDEX "product_variant_baseUnitId_idx" ON "product_variant"("baseUnitId");

-- CreateIndex
CREATE INDEX "product_variant_baseOrgUnitId_idx" ON "product_variant"("baseOrgUnitId");

-- CreateIndex
CREATE INDEX "product_variant_stockingUnitId_idx" ON "product_variant"("stockingUnitId");

-- CreateIndex
CREATE INDEX "product_variant_stockingOrgUnitId_idx" ON "product_variant"("stockingOrgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_productId_sku_key" ON "product_variant"("productId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_productId_barcode_key" ON "product_variant"("productId", "barcode");

-- CreateIndex
CREATE INDEX "variant_selling_unit_variantId_idx" ON "variant_selling_unit"("variantId");

-- CreateIndex
CREATE INDEX "variant_selling_unit_systemUnitId_idx" ON "variant_selling_unit"("systemUnitId");

-- CreateIndex
CREATE INDEX "variant_selling_unit_orgUnitId_idx" ON "variant_selling_unit"("orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "variant_selling_unit_variantId_systemUnitId_orgUnitId_key" ON "variant_selling_unit"("variantId", "systemUnitId", "orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Recall_recallNumber_key" ON "Recall"("recallNumber");

-- CreateIndex
CREATE INDEX "Recall_organizationId_idx" ON "Recall"("organizationId");

-- CreateIndex
CREATE INDEX "Recall_supplierId_idx" ON "Recall"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_name_key" ON "Supplier"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_email_key" ON "Supplier"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_id_key" ON "Supplier"("organizationId", "id");

-- CreateIndex
CREATE INDEX "ProductSupplier_supplierId_idx" ON "ProductSupplier"("supplierId");

-- CreateIndex
CREATE INDEX "ProductSupplier_productId_idx" ON "ProductSupplier"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplier_variantId_supplierId_key" ON "ProductSupplier"("variantId", "supplierId");

-- CreateIndex
CREATE INDEX "SupplierDocument_supplierId_idx" ON "SupplierDocument"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierDocument_organizationId_idx" ON "SupplierDocument"("organizationId");

-- CreateIndex
CREATE INDEX "SupplierPriceHistory_supplierId_idx" ON "SupplierPriceHistory"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPriceHistory_variantId_idx" ON "SupplierPriceHistory"("variantId");

-- CreateIndex
CREATE INDEX "SupplierPriceHistory_organizationId_idx" ON "SupplierPriceHistory"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_code_key" ON "InventoryLocation"("code");

-- CreateIndex
CREATE INDEX "InventoryLocation_name_idx" ON "InventoryLocation"("name");

-- CreateIndex
CREATE INDEX "InventoryLocation_organizationId_idx" ON "InventoryLocation"("organizationId");

-- CreateIndex
CREATE INDEX "InventoryLocation_managerId_idx" ON "InventoryLocation"("managerId");

-- CreateIndex
CREATE INDEX "InventoryLocation_locationType_idx" ON "InventoryLocation"("locationType");

-- CreateIndex
CREATE INDEX "InventoryLocation_isDefault_idx" ON "InventoryLocation"("isDefault");

-- CreateIndex
CREATE INDEX "InventoryLocation_parentLocationId_idx" ON "InventoryLocation"("parentLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_organizationId_name_key" ON "InventoryLocation"("organizationId", "name");

-- CreateIndex
CREATE INDEX "StorageZone_locationId_idx" ON "StorageZone"("locationId");

-- CreateIndex
CREATE INDEX "StorageZone_organizationId_idx" ON "StorageZone"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageZone_locationId_name_key" ON "StorageZone"("locationId", "name");

-- CreateIndex
CREATE INDEX "StorageUnit_locationId_idx" ON "StorageUnit"("locationId");

-- CreateIndex
CREATE INDEX "StorageUnit_zoneId_idx" ON "StorageUnit"("zoneId");

-- CreateIndex
CREATE INDEX "StorageUnit_unitType_idx" ON "StorageUnit"("unitType");

-- CreateIndex
CREATE INDEX "StorageUnit_organizationId_idx" ON "StorageUnit"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageUnit_locationId_zoneId_name_key" ON "StorageUnit"("locationId", "zoneId", "name");

-- CreateIndex
CREATE INDEX "QCTemplate_organizationId_idx" ON "QCTemplate"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "QCTemplate_organizationId_name_key" ON "QCTemplate"("organizationId", "name");

-- CreateIndex
CREATE INDEX "QCResult_organizationId_idx" ON "QCResult"("organizationId");

-- CreateIndex
CREATE INDEX "QCResult_stockBatchId_idx" ON "QCResult"("stockBatchId");

-- CreateIndex
CREATE INDEX "QCResult_purchaseItemId_idx" ON "QCResult"("purchaseItemId");

-- CreateIndex
CREATE INDEX "supplier_review_organizationId_idx" ON "supplier_review"("organizationId");

-- CreateIndex
CREATE INDEX "supplier_review_memberId_idx" ON "supplier_review"("memberId");

-- CreateIndex
CREATE INDEX "supplier_review_supplierId_idx" ON "supplier_review"("supplierId");

-- CreateIndex
CREATE INDEX "favorite_supplier_organizationId_idx" ON "favorite_supplier"("organizationId");

-- CreateIndex
CREATE INDEX "favorite_supplier_memberId_idx" ON "favorite_supplier"("memberId");

-- CreateIndex
CREATE INDEX "favorite_supplier_supplierId_idx" ON "favorite_supplier"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_supplier_memberId_supplierId_key" ON "favorite_supplier"("memberId", "supplierId");

-- CreateIndex
CREATE INDEX "StoragePosition_storageUnitId_idx" ON "StoragePosition"("storageUnitId");

-- CreateIndex
CREATE INDEX "StoragePosition_isOccupied_idx" ON "StoragePosition"("isOccupied");

-- CreateIndex
CREATE INDEX "StoragePosition_organizationId_idx" ON "StoragePosition"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "StoragePosition_storageUnitId_identifier_key" ON "StoragePosition"("storageUnitId", "identifier");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_postingDate_idx" ON "Invoice"("postingDate");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_templateId_idx" ON "Invoice"("templateId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "KRAComplianceLog_organizationId_idx" ON "KRAComplianceLog"("organizationId");

-- CreateIndex
CREATE INDEX "KRAComplianceLog_invoiceId_idx" ON "KRAComplianceLog"("invoiceId");

-- CreateIndex
CREATE INDEX "KRAComplianceLog_kraPin_idx" ON "KRAComplianceLog"("kraPin");

-- CreateIndex
CREATE INDEX "KRAComplianceLog_submittedAt_idx" ON "KRAComplianceLog"("submittedAt");

-- CreateIndex
CREATE INDEX "InvoiceTemplate_organizationId_idx" ON "InvoiceTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "InvoiceTemplate_isDefault_idx" ON "InvoiceTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "InvoiceTemplate_isActive_idx" ON "InvoiceTemplate"("isActive");

-- CreateIndex
CREATE INDEX "InvoiceTemplate_type_idx" ON "InvoiceTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceTemplate_organizationId_name_key" ON "InvoiceTemplate"("organizationId", "name");

-- CreateIndex
CREATE INDEX "InvoiceTemplateVersion_templateId_idx" ON "InvoiceTemplateVersion"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceTemplateVersion_templateId_versionNumber_key" ON "InvoiceTemplateVersion"("templateId", "versionNumber");

-- CreateIndex
CREATE INDEX "TemplateUsageLog_organizationId_idx" ON "TemplateUsageLog"("organizationId");

-- CreateIndex
CREATE INDEX "TemplateUsageLog_templateId_idx" ON "TemplateUsageLog"("templateId");

-- CreateIndex
CREATE INDEX "TemplateUsageLog_invoiceId_idx" ON "TemplateUsageLog"("invoiceId");

-- CreateIndex
CREATE INDEX "TemplateUsageLog_createdAt_idx" ON "TemplateUsageLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_config_organizationId_key" ON "invoice_config"("organizationId");

-- CreateIndex
CREATE INDEX "invoice_config_organizationId_idx" ON "invoice_config"("organizationId");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_organizationId_idx" ON "LoyaltyProgram"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_organizationId_name_key" ON "LoyaltyProgram"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTier_programId_minPoints_key" ON "LoyaltyTier"("programId", "minPoints");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTier_programId_name_key" ON "LoyaltyTier"("programId", "name");

-- CreateIndex
CREATE INDEX "LoyaltyRule_programId_idx" ON "LoyaltyRule"("programId");

-- CreateIndex
CREATE INDEX "LoyaltyReward_programId_idx" ON "LoyaltyReward"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyVoucher_code_key" ON "LoyaltyVoucher"("code");

-- CreateIndex
CREATE INDEX "LoyaltyVoucher_customerId_idx" ON "LoyaltyVoucher"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyVoucher_programId_idx" ON "LoyaltyVoucher"("programId");

-- CreateIndex
CREATE INDEX "LoyaltyVoucher_code_idx" ON "LoyaltyVoucher"("code");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_customerId_idx" ON "LoyaltyTransaction"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_programId_idx" ON "LoyaltyTransaction"("programId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_createdAt_idx" ON "LoyaltyTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_organizationId_name_key" ON "notification_template"("organizationId", "name");

-- CreateIndex
CREATE INDEX "notification_dispatch_organizationId_status_idx" ON "notification_dispatch"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_channel_config_organizationId_channel_key" ON "notification_channel_config"("organizationId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "organization_slug_idx" ON "organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "payment_credentials_organizationId_key" ON "payment_credentials"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "member_currentAttendanceLogId_key" ON "member"("currentAttendanceLogId");

-- CreateIndex
CREATE INDEX "member_organizationId_userId_idx" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "member_cardId_idx" ON "member"("cardId");

-- CreateIndex
CREATE INDEX "member_userId_cardId_idx" ON "member"("userId", "cardId");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "member_isCheckedIn_idx" ON "member"("isCheckedIn");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_cardId_key" ON "member"("organizationId", "cardId");

-- CreateIndex
CREATE INDEX "attendance_log_memberId_idx" ON "attendance_log"("memberId");

-- CreateIndex
CREATE INDEX "attendance_log_organizationId_idx" ON "attendance_log"("organizationId");

-- CreateIndex
CREATE INDEX "attendance_log_checkInTime_idx" ON "attendance_log"("checkInTime");

-- CreateIndex
CREATE INDEX "attendance_log_checkOutTime_idx" ON "attendance_log"("checkOutTime");

-- CreateIndex
CREATE INDEX "attendance_log_checkInLocationId_idx" ON "attendance_log"("checkInLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_role_organizationId_name_key" ON "custom_role"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_set_organizationId_name_key" ON "permission_set"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "role_group_organizationId_name_key" ON "role_group"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_token_key" ON "invitation"("token");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_inviterId_idx" ON "invitation"("inviterId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organizationId_key" ON "organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "department_activeBudgetId_key" ON "department"("activeBudgetId");

-- CreateIndex
CREATE INDEX "department_organizationId_idx" ON "department"("organizationId");

-- CreateIndex
CREATE INDEX "department_parentId_idx" ON "department"("parentId");

-- CreateIndex
CREATE INDEX "department_locationId_idx" ON "department"("locationId");

-- CreateIndex
CREATE INDEX "department_costCenterId_idx" ON "department"("costCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "department_organizationId_name_key" ON "department"("organizationId", "name");

-- CreateIndex
CREATE INDEX "department_member_memberId_idx" ON "department_member"("memberId");

-- CreateIndex
CREATE INDEX "department_member_departmentId_idx" ON "department_member"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "department_member_departmentId_memberId_key" ON "department_member"("departmentId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organizationId_key" ON "subscriptions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_dodo_customer_id_key" ON "subscriptions"("dodo_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_dodo_subscription_id_key" ON "subscriptions"("dodo_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_setup_token_tokenHash_key" ON "device_setup_token"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "device_setup_token_jti_key" ON "device_setup_token"("jti");

-- CreateIndex
CREATE INDEX "device_setup_token_organizationId_idx" ON "device_setup_token"("organizationId");

-- CreateIndex
CREATE INDEX "device_setup_token_jti_idx" ON "device_setup_token"("jti");

-- CreateIndex
CREATE INDEX "device_setup_token_locationId_idx" ON "device_setup_token"("locationId");

-- CreateIndex
CREATE INDEX "device_setup_token_createdById_idx" ON "device_setup_token"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "device_registry_apiKeyId_key" ON "device_registry"("apiKeyId");

-- CreateIndex
CREATE INDEX "device_registry_organizationId_idx" ON "device_registry"("organizationId");

-- CreateIndex
CREATE INDEX "device_registry_locationId_idx" ON "device_registry"("locationId");

-- CreateIndex
CREATE INDEX "device_registry_status_idx" ON "device_registry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_keyPrefix_key" ON "api_key"("keyPrefix");

-- CreateIndex
CREATE INDEX "api_key_organizationId_idx" ON "api_key"("organizationId");

-- CreateIndex
CREATE INDEX "api_key_createdById_idx" ON "api_key"("createdById");

-- CreateIndex
CREATE INDEX "api_key_locationId_idx" ON "api_key"("locationId");

-- CreateIndex
CREATE INDEX "api_key_isActive_idx" ON "api_key"("isActive");

-- CreateIndex
CREATE INDEX "api_key_rateLimitTier_idx" ON "api_key"("rateLimitTier");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_id_organizationId_key" ON "api_key"("id", "organizationId");

-- CreateIndex
CREATE INDEX "reports_organizationId_type_idx" ON "reports"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "reports_organizationId_type_startDate_endDate_key" ON "reports"("organizationId", "type", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "plane_configuration_organizationId_key" ON "plane_configuration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "plane_configuration_workspaceId_key" ON "plane_configuration"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "plane_configuration_workspaceSlug_key" ON "plane_configuration"("workspaceSlug");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_code_key" ON "PriceList"("code");

-- CreateIndex
CREATE INDEX "PriceList_organizationId_isActive_idx" ON "PriceList"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "PriceList_organizationId_approvalStatus_idx" ON "PriceList"("organizationId", "approvalStatus");

-- CreateIndex
CREATE INDEX "PriceList_validFrom_validTo_idx" ON "PriceList"("validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_organizationId_code_key" ON "PriceList"("organizationId", "code");

-- CreateIndex
CREATE INDEX "PriceListItem_variantId_idx" ON "PriceListItem"("variantId");

-- CreateIndex
CREATE INDEX "PriceListItem_sellingUnitId_idx" ON "PriceListItem"("sellingUnitId");

-- CreateIndex
CREATE INDEX "PriceListItem_updatedAt_idx" ON "PriceListItem"("updatedAt");

-- CreateIndex
CREATE INDEX "PriceListItem_deletedAt_idx" ON "PriceListItem"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_priceListId_variantId_sellingUnitId_minQuanti_key" ON "PriceListItem"("priceListId", "variantId", "sellingUnitId", "minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_priceListId_variantId_minQuantity_key" ON "PriceListItem"("priceListId", "variantId", "minQuantity");

-- CreateIndex
CREATE INDEX "PricingRule_priceListId_isActive_idx" ON "PricingRule"("priceListId", "isActive");

-- CreateIndex
CREATE INDEX "PricingRule_organizationId_isActive_idx" ON "PricingRule"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "PricingRule_validFrom_validTo_idx" ON "PricingRule"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "PricingBundle_organizationId_isActive_idx" ON "PricingBundle"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "PricingBundle_bundleType_idx" ON "PricingBundle"("bundleType");

-- CreateIndex
CREATE INDEX "PricingBundle_validFrom_validTo_idx" ON "PricingBundle"("validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "PricingBundle_organizationId_code_key" ON "PricingBundle"("organizationId", "code");

-- CreateIndex
CREATE INDEX "PricingBundleItem_variantId_idx" ON "PricingBundleItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingBundleItem_bundleId_variantId_itemRole_key" ON "PricingBundleItem"("bundleId", "variantId", "itemRole");

-- CreateIndex
CREATE INDEX "PriceHistory_priceListItemId_idx" ON "PriceHistory"("priceListItemId");

-- CreateIndex
CREATE INDEX "PriceHistory_createdAt_idx" ON "PriceHistory"("createdAt");

-- CreateIndex
CREATE INDEX "PriceHistory_changedBy_idx" ON "PriceHistory"("changedBy");

-- CreateIndex
CREATE INDEX "PriceImportJob_organizationId_status_idx" ON "PriceImportJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PriceImportJob_createdAt_idx" ON "PriceImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "price_change_request_organizationId_status_idx" ON "price_change_request"("organizationId", "status");

-- CreateIndex
CREATE INDEX "price_change_request_priceListItemId_idx" ON "price_change_request"("priceListItemId");

-- CreateIndex
CREATE UNIQUE INDEX "scryme_configuration_organizationId_key" ON "scryme_configuration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "scryme_configuration_workspaceId_key" ON "scryme_configuration"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "scryme_configuration_workspaceSlug_key" ON "scryme_configuration"("workspaceSlug");

-- CreateIndex
CREATE UNIQUE INDEX "scryme_messages_messageId_key" ON "scryme_messages"("messageId");

-- CreateIndex
CREATE INDEX "scryme_messages_organizationId_idx" ON "scryme_messages"("organizationId");

-- CreateIndex
CREATE INDEX "scryme_messages_relatedId_idx" ON "scryme_messages"("relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "standalone_setup_key_token_key" ON "standalone_setup_key"("token");

-- CreateIndex
CREATE UNIQUE INDEX "standalone_device_machineId_key" ON "standalone_device"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "standalone_device_key_key_key" ON "standalone_device_key"("key");

-- CreateIndex
CREATE INDEX "reorder_rule_organizationId_isActive_idx" ON "reorder_rule"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "reorder_rule_locationId_idx" ON "reorder_rule"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "reorder_rule_organizationId_productId_variantId_locationId_key" ON "reorder_rule"("organizationId", "productId", "variantId", "locationId");

-- CreateIndex
CREATE INDEX "reorder_alert_organizationId_status_idx" ON "reorder_alert"("organizationId", "status");

-- CreateIndex
CREATE INDEX "reorder_alert_alertDate_idx" ON "reorder_alert"("alertDate");

-- CreateIndex
CREATE INDEX "stock_audit_log_organizationId_entityType_entityId_idx" ON "stock_audit_log"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "stock_audit_log_performedBy_idx" ON "stock_audit_log"("performedBy");

-- CreateIndex
CREATE INDEX "stock_audit_log_timestamp_idx" ON "stock_audit_log"("timestamp");

-- CreateIndex
CREATE INDEX "purchase_approval_chain_organizationId_isActive_idx" ON "purchase_approval_chain"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "purchase_approval_step_chainId_idx" ON "purchase_approval_step"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_approval_step_chainId_stepOrder_key" ON "purchase_approval_step"("chainId", "stepOrder");

-- CreateIndex
CREATE INDEX "stock_take_organizationId_status_idx" ON "stock_take"("organizationId", "status");

-- CreateIndex
CREATE INDEX "stock_take_locationId_idx" ON "stock_take"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_take_organizationId_stockTakeNumber_key" ON "stock_take"("organizationId", "stockTakeNumber");

-- CreateIndex
CREATE INDEX "stock_take_item_stockTakeId_idx" ON "stock_take_item"("stockTakeId");

-- CreateIndex
CREATE INDEX "stock_take_item_variantId_idx" ON "stock_take_item"("variantId");

-- CreateIndex
CREATE INDEX "supplier_performance_supplierId_idx" ON "supplier_performance"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_performance_organizationId_idx" ON "supplier_performance"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_performance_organizationId_supplierId_periodStart__key" ON "supplier_performance"("organizationId", "supplierId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "stock_valuation_organizationId_valuationDate_idx" ON "stock_valuation"("organizationId", "valuationDate");

-- CreateIndex
CREATE INDEX "stock_valuation_locationId_idx" ON "stock_valuation"("locationId");

-- CreateIndex
CREATE INDEX "CycleCountConfig_organizationId_idx" ON "CycleCountConfig"("organizationId");

-- CreateIndex
CREATE INDEX "StockBatch_expiryDate_idx" ON "StockBatch"("expiryDate");

-- CreateIndex
CREATE INDEX "StockBatch_receivedDate_idx" ON "StockBatch"("receivedDate");

-- CreateIndex
CREATE INDEX "StockBatch_currentQuantity_idx" ON "StockBatch"("currentQuantity");

-- CreateIndex
CREATE INDEX "StockBatch_locationId_idx" ON "StockBatch"("locationId");

-- CreateIndex
CREATE INDEX "StockBatch_organizationId_idx" ON "StockBatch"("organizationId");

-- CreateIndex
CREATE INDEX "StockBatch_storageUnitId_idx" ON "StockBatch"("storageUnitId");

-- CreateIndex
CREATE INDEX "StockBatch_positionId_idx" ON "StockBatch"("positionId");

-- CreateIndex
CREATE INDEX "StockReceipt_organizationId_idx" ON "StockReceipt"("organizationId");

-- CreateIndex
CREATE INDEX "StockReceipt_purchaseId_idx" ON "StockReceipt"("purchaseId");

-- CreateIndex
CREATE INDEX "ProductVariantStock_productId_idx" ON "ProductVariantStock"("productId");

-- CreateIndex
CREATE INDEX "ProductVariantStock_locationId_idx" ON "ProductVariantStock"("locationId");

-- CreateIndex
CREATE INDEX "ProductVariantStock_organizationId_idx" ON "ProductVariantStock"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantStock_variantId_locationId_key" ON "ProductVariantStock"("variantId", "locationId");

-- CreateIndex
CREATE INDEX "SerialNumber_variantId_idx" ON "SerialNumber"("variantId");

-- CreateIndex
CREATE INDEX "SerialNumber_stockBatchId_idx" ON "SerialNumber"("stockBatchId");

-- CreateIndex
CREATE INDEX "SerialNumber_organizationId_idx" ON "SerialNumber"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SerialNumber_organizationId_serialNumber_key" ON "SerialNumber"("organizationId", "serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_adjustmentId_key" ON "StockMovement"("adjustmentId");

-- CreateIndex
CREATE INDEX "StockMovement_stockBatchId_idx" ON "StockMovement"("stockBatchId");

-- CreateIndex
CREATE INDEX "StockMovement_fromLocationId_idx" ON "StockMovement"("fromLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_toLocationId_idx" ON "StockMovement"("toLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_referenceId_idx" ON "StockMovement"("movementType", "referenceId");

-- CreateIndex
CREATE INDEX "StockMovement_movementDate_idx" ON "StockMovement"("movementDate");

-- CreateIndex
CREATE INDEX "StockMovement_memberId_idx" ON "StockMovement"("memberId");

-- CreateIndex
CREATE INDEX "StockMovement_organizationId_idx" ON "StockMovement"("organizationId");

-- CreateIndex
CREATE INDEX "StockAdjustment_stockBatchId_idx" ON "StockAdjustment"("stockBatchId");

-- CreateIndex
CREATE INDEX "StockAdjustment_adjustmentDate_idx" ON "StockAdjustment"("adjustmentDate");

-- CreateIndex
CREATE INDEX "StockAdjustment_locationId_idx" ON "StockAdjustment"("locationId");

-- CreateIndex
CREATE INDEX "StockAdjustment_memberId_idx" ON "StockAdjustment"("memberId");

-- CreateIndex
CREATE INDEX "StockAdjustment_organizationId_idx" ON "StockAdjustment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_assembly_assemblyNumber_key" ON "stock_assembly"("assemblyNumber");

-- CreateIndex
CREATE INDEX "stock_assembly_organizationId_idx" ON "stock_assembly"("organizationId");

-- CreateIndex
CREATE INDEX "stock_assembly_variantId_idx" ON "stock_assembly"("variantId");

-- CreateIndex
CREATE INDEX "stock_assembly_item_assemblyId_idx" ON "stock_assembly_item"("assemblyId");

-- CreateIndex
CREATE INDEX "stock_assembly_item_variantId_idx" ON "stock_assembly_item"("variantId");

-- CreateIndex
CREATE INDEX "stock_request_organizationId_status_idx" ON "stock_request"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stock_request_organizationId_requestNumber_key" ON "stock_request"("organizationId", "requestNumber");

-- CreateIndex
CREATE INDEX "stock_transfer_organizationId_status_idx" ON "stock_transfer"("organizationId", "status");

-- CreateIndex
CREATE INDEX "stock_transfer_stockRequestId_idx" ON "stock_transfer"("stockRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_organizationId_transferNumber_key" ON "stock_transfer"("organizationId", "transferNumber");

-- CreateIndex
CREATE UNIQUE INDEX "stock_report_templates_organizationId_name_key" ON "stock_report_templates"("organizationId", "name");

-- CreateIndex
CREATE INDEX "generated_stock_reports_organizationId_templateId_idx" ON "generated_stock_reports"("organizationId", "templateId");

-- CreateIndex
CREATE INDEX "generated_stock_reports_generatedById_idx" ON "generated_stock_reports"("generatedById");

-- CreateIndex
CREATE INDEX "report_automations_organizationId_status_idx" ON "report_automations"("organizationId", "status");

-- CreateIndex
CREATE INDEX "report_automations_nextRunAt_idx" ON "report_automations"("nextRunAt");

-- CreateIndex
CREATE INDEX "report_automations_templateId_idx" ON "report_automations"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "report_automations_organizationId_name_key" ON "report_automations"("organizationId", "name");

-- CreateIndex
CREATE INDEX "report_automation_executions_createdAt_idx" ON "report_automation_executions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "report_channels_organizationId_name_key" ON "report_channels"("organizationId", "name");

-- CreateIndex
CREATE INDEX "StockReconciliation_organizationId_idx" ON "StockReconciliation"("organizationId");

-- CreateIndex
CREATE INDEX "StockReconciliation_locationId_idx" ON "StockReconciliation"("locationId");

-- CreateIndex
CREATE INDEX "StockReconciliation_status_idx" ON "StockReconciliation"("status");

-- CreateIndex
CREATE INDEX "StockReconciliation_reconciliationDate_idx" ON "StockReconciliation"("reconciliationDate");

-- CreateIndex
CREATE INDEX "ReconciliationItem_reconciliationId_idx" ON "ReconciliationItem"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationItem_productVariantId_idx" ON "ReconciliationItem"("productVariantId");

-- CreateIndex
CREATE INDEX "MovementReconciliationLink_reconciliationId_idx" ON "MovementReconciliationLink"("reconciliationId");

-- CreateIndex
CREATE INDEX "MovementReconciliationLink_movementId_idx" ON "MovementReconciliationLink"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "MovementReconciliationLink_reconciliationId_movementId_key" ON "MovementReconciliationLink"("reconciliationId", "movementId");

-- CreateIndex
CREATE INDEX "ActionAuditLog_organizationId_idx" ON "ActionAuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "ActionAuditLog_memberId_idx" ON "ActionAuditLog"("memberId");

-- CreateIndex
CREATE INDEX "ActionAuditLog_action_idx" ON "ActionAuditLog"("action");

-- CreateIndex
CREATE INDEX "ActionAuditLog_resourceType_resourceId_idx" ON "ActionAuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "ActionAuditLog_createdAt_idx" ON "ActionAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tax_authority_organizationId_name_key" ON "tax_authority"("organizationId", "name");

-- CreateIndex
CREATE INDEX "tax_organizationId_idx" ON "tax"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_organizationId_name_key" ON "tax"("organizationId", "name");

-- CreateIndex
CREATE INDEX "tax_filing_taxAuthorityId_periodEndDate_idx" ON "tax_filing"("taxAuthorityId", "periodEndDate");

-- CreateIndex
CREATE UNIQUE INDEX "tax_filing_organizationId_filingNumber_key" ON "tax_filing"("organizationId", "filingNumber");

-- CreateIndex
CREATE INDEX "tax_payment_filingId_idx" ON "tax_payment"("filingId");

-- CreateIndex
CREATE INDEX "applied_tax_transactionId_idx" ON "applied_tax"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "applied_expense_tax_expenseId_taxId_key" ON "applied_expense_tax"("expenseId", "taxId");

-- CreateIndex
CREATE INDEX "applied_purchase_tax_purchaseId_idx" ON "applied_purchase_tax"("purchaseId");

-- CreateIndex
CREATE INDEX "transaction_organizationId_status_idx" ON "transaction"("organizationId", "status");

-- CreateIndex
CREATE INDEX "transaction_organizationId_type_idx" ON "transaction"("organizationId", "type");

-- CreateIndex
CREATE INDEX "transaction_customerId_idx" ON "transaction"("customerId");

-- CreateIndex
CREATE INDEX "transaction_businessAccountId_idx" ON "transaction"("businessAccountId");

-- CreateIndex
CREATE INDEX "transaction_createdAt_idx" ON "transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_organizationId_number_key" ON "transaction"("organizationId", "number");

-- CreateIndex
CREATE INDEX "transaction_item_transactionId_idx" ON "transaction_item"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_item_variantId_idx" ON "transaction_item"("variantId");

-- CreateIndex
CREATE INDEX "inventory_allocation_transactionItemId_idx" ON "inventory_allocation"("transactionItemId");

-- CreateIndex
CREATE INDEX "inventory_allocation_stockBatchId_idx" ON "inventory_allocation"("stockBatchId");

-- CreateIndex
CREATE INDEX "payment_transactionId_idx" ON "payment"("transactionId");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- CreateIndex
CREATE INDEX "payment_payoutId_idx" ON "payment"("payoutId");

-- CreateIndex
CREATE INDEX "payment_gatewayTxnId_idx" ON "payment"("gatewayTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "unclaimed_payment_transId_key" ON "unclaimed_payment"("transId");

-- CreateIndex
CREATE INDEX "unclaimed_payment_organizationId_idx" ON "unclaimed_payment"("organizationId");

-- CreateIndex
CREATE INDEX "unclaimed_payment_transId_idx" ON "unclaimed_payment"("transId");

-- CreateIndex
CREATE INDEX "unclaimed_payment_msisdn_idx" ON "unclaimed_payment"("msisdn");

-- CreateIndex
CREATE INDEX "unclaimed_payment_claimed_idx" ON "unclaimed_payment"("claimed");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_config_organizationId_key" ON "receipt_config"("organizationId");

-- CreateIndex
CREATE INDEX "receipt_config_organizationId_idx" ON "receipt_config"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "waybill_config_organizationId_key" ON "waybill_config"("organizationId");

-- CreateIndex
CREATE INDEX "waybill_config_organizationId_idx" ON "waybill_config"("organizationId");

-- CreateIndex
CREATE INDEX "payout_status_idx" ON "payout"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payout_organizationId_gateway_payoutNumber_key" ON "payout"("organizationId", "gateway", "payoutNumber");

-- CreateIndex
CREATE INDEX "fulfillment_transactionId_idx" ON "fulfillment"("transactionId");

-- CreateIndex
CREATE INDEX "fulfillment_status_idx" ON "fulfillment"("status");

-- CreateIndex
CREATE INDEX "fulfillment_driverId_idx" ON "fulfillment"("driverId");

-- CreateIndex
CREATE INDEX "fulfillment_item_fulfillmentId_idx" ON "fulfillment_item"("fulfillmentId");

-- CreateIndex
CREATE INDEX "fulfillment_item_transactionItemId_idx" ON "fulfillment_item"("transactionItemId");

-- CreateIndex
CREATE INDEX "applied_discount_transactionId_idx" ON "applied_discount"("transactionId");

-- CreateIndex
CREATE INDEX "applied_discount_transactionItemId_idx" ON "applied_discount"("transactionItemId");

-- CreateIndex
CREATE INDEX "return_transactionId_idx" ON "return"("transactionId");

-- CreateIndex
CREATE INDEX "return_status_idx" ON "return"("status");

-- CreateIndex
CREATE UNIQUE INDEX "return_organizationId_returnNumber_key" ON "return"("organizationId", "returnNumber");

-- CreateIndex
CREATE INDEX "return_item_returnId_idx" ON "return_item"("returnId");

-- CreateIndex
CREATE INDEX "return_item_transactionItemId_idx" ON "return_item"("transactionItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_shortCode_key" ON "Attachment"("shortCode");

-- CreateIndex
CREATE INDEX "Attachment_memberId_idx" ON "Attachment"("memberId");

-- CreateIndex
CREATE INDEX "Attachment_transactionId_idx" ON "Attachment"("transactionId");

-- CreateIndex
CREATE INDEX "Attachment_purchaseId_idx" ON "Attachment"("purchaseId");

-- CreateIndex
CREATE INDEX "Attachment_organizationId_idx" ON "Attachment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "global_setting_key_key" ON "global_setting"("key");

-- CreateIndex
CREATE INDEX "CashDrawer_locationId_idx" ON "CashDrawer"("locationId");

-- CreateIndex
CREATE INDEX "CashDrawer_openedAt_idx" ON "CashDrawer"("openedAt");

-- CreateIndex
CREATE INDEX "CashDrawer_closedAt_idx" ON "CashDrawer"("closedAt");

-- CreateIndex
CREATE INDEX "CashDrawer_memberId_idx" ON "CashDrawer"("memberId");

-- CreateIndex
CREATE INDEX "CashDrawer_organizationId_idx" ON "CashDrawer"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CashDrawer_organizationId_name_key" ON "CashDrawer"("organizationId", "name");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_memberId_idx" ON "audit_log"("memberId");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_performedAt_idx" ON "audit_log"("organizationId", "performedAt");

-- CreateIndex
CREATE INDEX "MpesaPaymentRequest_organizationId_idx" ON "MpesaPaymentRequest"("organizationId");

-- CreateIndex
CREATE INDEX "MpesaPaymentRequest_memberId_idx" ON "MpesaPaymentRequest"("memberId");

-- CreateIndex
CREATE INDEX "MpesaPaymentRequest_checkoutRequestId_idx" ON "MpesaPaymentRequest"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "MpesaPaymentRequest_merchantRequestId_idx" ON "MpesaPaymentRequest"("merchantRequestId");

-- CreateIndex
CREATE INDEX "MpesaPaymentRequest_reference_idx" ON "MpesaPaymentRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "system_unit_name_key" ON "system_unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "system_unit_symbol_key" ON "system_unit"("symbol");

-- CreateIndex
CREATE INDEX "system_unit_type_idx" ON "system_unit"("type");

-- CreateIndex
CREATE INDEX "system_unit_category_idx" ON "system_unit"("category");

-- CreateIndex
CREATE INDEX "system_unit_isActive_idx" ON "system_unit"("isActive");

-- CreateIndex
CREATE INDEX "organization_unit_organizationId_idx" ON "organization_unit"("organizationId");

-- CreateIndex
CREATE INDEX "organization_unit_type_idx" ON "organization_unit"("type");

-- CreateIndex
CREATE INDEX "organization_unit_isActive_idx" ON "organization_unit"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "organization_unit_organizationId_symbol_key" ON "organization_unit"("organizationId", "symbol");

-- CreateIndex
CREATE INDEX "org_unit_conversion_organizationId_idx" ON "org_unit_conversion"("organizationId");

-- CreateIndex
CREATE INDEX "org_unit_conversion_fromUnitId_idx" ON "org_unit_conversion"("fromUnitId");

-- CreateIndex
CREATE INDEX "org_unit_conversion_toUnitId_idx" ON "org_unit_conversion"("toUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "org_unit_conversion_organizationId_fromUnitId_toUnitId_key" ON "org_unit_conversion"("organizationId", "fromUnitId", "toUnitId");

-- CreateIndex
CREATE INDEX "unit_conversion_fromUnitId_idx" ON "unit_conversion"("fromUnitId");

-- CreateIndex
CREATE INDEX "unit_conversion_toUnitId_idx" ON "unit_conversion"("toUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_conversion_fromUnitId_toUnitId_key" ON "unit_conversion"("fromUnitId", "toUnitId");

-- CreateIndex
CREATE INDEX "product_unit_conversion_productId_idx" ON "product_unit_conversion"("productId");

-- CreateIndex
CREATE INDEX "product_unit_conversion_fromUnitId_idx" ON "product_unit_conversion"("fromUnitId");

-- CreateIndex
CREATE INDEX "product_unit_conversion_toUnitId_idx" ON "product_unit_conversion"("toUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "product_unit_conversion_productId_fromUnitId_toUnitId_key" ON "product_unit_conversion"("productId", "fromUnitId", "toUnitId");

-- CreateIndex
CREATE INDEX "address_customerId_idx" ON "address"("customerId");

-- CreateIndex
CREATE INDEX "address_businessAccountId_idx" ON "address"("businessAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "v3_api_client_clientId_key" ON "v3_api_client"("clientId");

-- CreateIndex
CREATE INDEX "v3_api_client_organizationId_idx" ON "v3_api_client"("organizationId");

-- CreateIndex
CREATE INDEX "webhook_subscription_organizationId_idx" ON "webhook_subscription"("organizationId");

-- CreateIndex
CREATE INDEX "webhook_log_subscriptionId_idx" ON "webhook_log"("subscriptionId");

-- CreateIndex
CREATE INDEX "webhook_log_status_idx" ON "webhook_log"("status");

-- CreateIndex
CREATE UNIQUE INDEX "windmill_configuration_organizationId_key" ON "windmill_configuration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "windmill_configuration_workspaceId_key" ON "windmill_configuration"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "windmill_workflow_organizationId_path_key" ON "windmill_workflow"("organizationId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "windmill_execution_jobId_key" ON "windmill_execution"("jobId");

-- CreateIndex
CREATE INDEX "windmill_execution_organizationId_scriptPath_idx" ON "windmill_execution"("organizationId", "scriptPath");

-- CreateIndex
CREATE INDEX "windmill_execution_correlationId_idx" ON "windmill_execution"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "zitadel_configuration_organizationId_key" ON "zitadel_configuration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "zitadel_configuration_zitadelOrgId_key" ON "zitadel_configuration"("zitadelOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "zitadel_configuration_zitadelProjectId_key" ON "zitadel_configuration"("zitadelProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "zitadel_configuration_zitadelAppId_key" ON "zitadel_configuration"("zitadelAppId");

-- CreateIndex
CREATE INDEX "zitadel_webhook_log_configId_event_idx" ON "zitadel_webhook_log"("configId", "event");

-- CreateIndex
CREATE INDEX "zitadel_webhook_log_organizationId_status_idx" ON "zitadel_webhook_log"("organizationId", "status");

-- CreateIndex
CREATE INDEX "zitadel_webhook_log_zitadelUserId_idx" ON "zitadel_webhook_log"("zitadelUserId");

-- CreateIndex
CREATE INDEX "_AssistantBakerBatches_B_index" ON "_AssistantBakerBatches"("B");

-- CreateIndex
CREATE INDEX "_TemplateAssistantBakers_B_index" ON "_TemplateAssistantBakers"("B");

-- CreateIndex
CREATE INDEX "_CustomerToPriceList_B_index" ON "_CustomerToPriceList"("B");

-- CreateIndex
CREATE INDEX "_BusinessAccountToPriceList_B_index" ON "_BusinessAccountToPriceList"("B");

-- CreateIndex
CREATE INDEX "_ExpenseApprovalWorkflows_B_index" ON "_ExpenseApprovalWorkflows"("B");

-- CreateIndex
CREATE INDEX "_VariantQCTemplates_B_index" ON "_VariantQCTemplates"("B");

-- CreateIndex
CREATE INDEX "_MemberRoleGroups_B_index" ON "_MemberRoleGroups"("B");

-- CreateIndex
CREATE INDEX "_MemberCustomRoles_B_index" ON "_MemberCustomRoles"("B");

-- CreateIndex
CREATE INDEX "_RoleGroupPermissionSets_B_index" ON "_RoleGroupPermissionSets"("B");

-- CreateIndex
CREATE INDEX "_MovementSerialNumbers_B_index" ON "_MovementSerialNumbers"("B");

-- CreateIndex
CREATE INDEX "_AutomationChannels_B_index" ON "_AutomationChannels"("B");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_usage_log" ADD CONSTRAINT "api_key_usage_log_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_usage_log" ADD CONSTRAINT "api_key_usage_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bakery_category" ADD CONSTRAINT "bakery_category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "bakery_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_producesVariantId_fkey" FOREIGN KEY ("producesVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_systemUnitId_fkey" FOREIGN KEY ("systemUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_systemUnitId_fkey" FOREIGN KEY ("systemUnitId") REFERENCES "system_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_leadBakerId_fkey" FOREIGN KEY ("leadBakerId") REFERENCES "bakery_bakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_createdFromTemplateId_fkey" FOREIGN KEY ("createdFromTemplateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_canceledById_fkey" FOREIGN KEY ("canceledById") REFERENCES "bakery_bakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_outputLocationId_fkey" FOREIGN KEY ("outputLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_disposedById_fkey" FOREIGN KEY ("disposedById") REFERENCES "bakery_bakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_recallId_fkey" FOREIGN KEY ("recallId") REFERENCES "Recall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_systemUnitId_fkey" FOREIGN KEY ("systemUnitId") REFERENCES "system_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_leadBakerId_fkey" FOREIGN KEY ("leadBakerId") REFERENCES "bakery_bakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_schedule" ADD CONSTRAINT "template_schedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_ingredientVariantId_fkey" FOREIGN KEY ("ingredientVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_systemUnitId_fkey" FOREIGN KEY ("systemUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bakery_settings" ADD CONSTRAINT "bakery_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bakery_settings" ADD CONSTRAINT "bakery_settings_defaultBakerId_fkey" FOREIGN KEY ("defaultBakerId") REFERENCES "bakery_bakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_ingredient_consumption" ADD CONSTRAINT "batch_ingredient_consumption_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_ingredient_consumption" ADD CONSTRAINT "batch_ingredient_consumption_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_ingredient_consumption" ADD CONSTRAINT "batch_ingredient_consumption_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_incident" ADD CONSTRAINT "quality_incident_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_incident" ADD CONSTRAINT "quality_incident_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_incident" ADD CONSTRAINT "quality_incident_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_incident" ADD CONSTRAINT "quality_incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_incident" ADD CONSTRAINT "quality_incident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bakery_bakers" ADD CONSTRAINT "bakery_bakers_bakerySettingsId_fkey" FOREIGN KEY ("bakerySettingsId") REFERENCES "bakery_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bakery_bakers" ADD CONSTRAINT "bakery_bakers_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_partner" ADD CONSTRAINT "delivery_partner_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_wallet_log" ADD CONSTRAINT "partner_wallet_log_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "delivery_partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "campaign_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "campaign_workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_segments" ADD CONSTRAINT "campaign_segments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_workflows" ADD CONSTRAINT "campaign_workflows_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_workflow_instances" ADD CONSTRAINT "campaign_workflow_instances_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "campaign_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_workflow_instances" ADD CONSTRAINT "campaign_workflow_instances_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "crm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "crm_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_object_definitions" ADD CONSTRAINT "crm_object_definitions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_field_definitions" ADD CONSTRAINT "crm_field_definitions_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "crm_object_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_records" ADD CONSTRAINT "crm_records_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "crm_object_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_records" ADD CONSTRAINT "crm_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_records" ADD CONSTRAINT "crm_records_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_relationship_definitions" ADD CONSTRAINT "crm_relationship_definitions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_relationship_definitions" ADD CONSTRAINT "crm_relationship_definitions_sourceObjectId_fkey" FOREIGN KEY ("sourceObjectId") REFERENCES "crm_object_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_relationship_definitions" ADD CONSTRAINT "crm_relationship_definitions_targetObjectId_fkey" FOREIGN KEY ("targetObjectId") REFERENCES "crm_object_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_associations" ADD CONSTRAINT "crm_associations_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "crm_relationship_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_associations" ADD CONSTRAINT "crm_associations_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "crm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_associations" ADD CONSTRAINT "crm_associations_targetRecordId_fkey" FOREIGN KEY ("targetRecordId") REFERENCES "crm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "crm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "crm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_follow_ups" ADD CONSTRAINT "crm_follow_ups_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "crm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_follow_ups" ADD CONSTRAINT "crm_follow_ups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_follow_ups" ADD CONSTRAINT "crm_follow_ups_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_follow_ups" ADD CONSTRAINT "crm_follow_ups_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_crmRecordId_fkey" FOREIGN KEY ("crmRecordId") REFERENCES "crm_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_account" ADD CONSTRAINT "business_account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_account" ADD CONSTRAINT "business_account_crmRecordId_fkey" FOREIGN KEY ("crmRecordId") REFERENCES "crm_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BConnection" ADD CONSTRAINT "B2BConnection_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BConnection" ADD CONSTRAINT "B2BConnection_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_program" ADD CONSTRAINT "referral_program_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_programId_fkey" FOREIGN KEY ("programId") REFERENCES "referral_program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "delivery_partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_connection" ADD CONSTRAINT "ecommerce_connection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_connection" ADD CONSTRAINT "ecommerce_connection_defaultLocationId_fkey" FOREIGN KEY ("defaultLocationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_sync_log" ADD CONSTRAINT "ecommerce_sync_log_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ecommerce_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_sync_log" ADD CONSTRAINT "ecommerce_sync_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_mapping" ADD CONSTRAINT "ecommerce_product_mapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ecommerce_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_mapping" ADD CONSTRAINT "ecommerce_product_mapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_mapping" ADD CONSTRAINT "ecommerce_product_mapping_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_mapping" ADD CONSTRAINT "ecommerce_product_mapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_order_mapping" ADD CONSTRAINT "ecommerce_order_mapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ecommerce_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_order_mapping" ADD CONSTRAINT "ecommerce_order_mapping_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_order_mapping" ADD CONSTRAINT "ecommerce_order_mapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_customer_mapping" ADD CONSTRAINT "ecommerce_customer_mapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ecommerce_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_customer_mapping" ADD CONSTRAINT "ecommerce_customer_mapping_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_customer_mapping" ADD CONSTRAINT "ecommerce_customer_mapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_webhook_log" ADD CONSTRAINT "ecommerce_webhook_log_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ecommerce_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_webhook_log" ADD CONSTRAINT "ecommerce_webhook_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_pettyCashFundId_fkey" FOREIGN KEY ("pettyCashFundId") REFERENCES "PettyCashFund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_utilityAccountId_fkey" FOREIGN KEY ("utilityAccountId") REFERENCES "UtilityAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES "RecurringExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_utilityAccountId_fkey" FOREIGN KEY ("utilityAccountId") REFERENCES "UtilityAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetReport" ADD CONSTRAINT "BudgetReport_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetReport" ADD CONSTRAINT "BudgetReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAlert" ADD CONSTRAINT "BudgetAlert_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAlert" ADD CONSTRAINT "BudgetAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashFund" ADD CONSTRAINT "PettyCashFund_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashFund" ADD CONSTRAINT "PettyCashFund_responsibleMemberId_fkey" FOREIGN KEY ("responsibleMemberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashFund" ADD CONSTRAINT "PettyCashFund_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTransaction" ADD CONSTRAINT "PettyCashTransaction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "PettyCashFund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTransaction" ADD CONSTRAINT "PettyCashTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityAccount" ADD CONSTRAINT "UtilityAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_stockRequestId_fkey" FOREIGN KEY ("stockRequestId") REFERENCES "stock_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_orderedUnitId_fkey" FOREIGN KEY ("orderedUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_orderedOrgUnitId_fkey" FOREIGN KEY ("orderedOrgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnItem" ADD CONSTRAINT "PurchaseReturnItem_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnItem" ADD CONSTRAINT "PurchaseReturnItem_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflow" ADD CONSTRAINT "ApprovalWorkflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowStep" ADD CONSTRAINT "ApprovalWorkflowStep_approvalWorkflowId_fkey" FOREIGN KEY ("approvalWorkflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepCondition" ADD CONSTRAINT "ApprovalStepCondition_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ApprovalWorkflowStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepCondition" ADD CONSTRAINT "ApprovalStepCondition_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepCondition" ADD CONSTRAINT "ApprovalStepCondition_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepAction" ADD CONSTRAINT "ApprovalStepAction_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ApprovalWorkflowStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepAction" ADD CONSTRAINT "ApprovalStepAction_specificMemberId_fkey" FOREIGN KEY ("specificMemberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_bankStatementLineId_fkey" FOREIGN KEY ("bankStatementLineId") REFERENCES "BankStatementLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "BankStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "huly_configuration" ADD CONSTRAINT "huly_configuration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "huly_notification_rule" ADD CONSTRAINT "huly_notification_rule_configId_fkey" FOREIGN KEY ("configId") REFERENCES "huly_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "huly_event_log" ADD CONSTRAINT "huly_event_log_configId_fkey" FOREIGN KEY ("configId") REFERENCES "huly_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "huly_channel_mapping" ADD CONSTRAINT "huly_channel_mapping_configId_fkey" FOREIGN KEY ("configId") REFERENCES "huly_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_integration" ADD CONSTRAINT "organization_integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_integration" ADD CONSTRAINT "organization_integration_integrationDefinitionId_fkey" FOREIGN KEY ("integrationDefinitionId") REFERENCES "integration_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_mapping" ADD CONSTRAINT "external_mapping_organizationIntegrationId_fkey" FOREIGN KEY ("organizationIntegrationId") REFERENCES "organization_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_event" ADD CONSTRAINT "integration_event_organizationIntegrationId_fkey" FOREIGN KEY ("organizationIntegrationId") REFERENCES "organization_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_defaultLocationId_fkey" FOREIGN KEY ("defaultLocationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_baseUnitId_fkey" FOREIGN KEY ("baseUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_baseOrgUnitId_fkey" FOREIGN KEY ("baseOrgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_stockingUnitId_fkey" FOREIGN KEY ("stockingUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_stockingOrgUnitId_fkey" FOREIGN KEY ("stockingOrgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_selling_unit" ADD CONSTRAINT "variant_selling_unit_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_selling_unit" ADD CONSTRAINT "variant_selling_unit_systemUnitId_fkey" FOREIGN KEY ("systemUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_selling_unit" ADD CONSTRAINT "variant_selling_unit_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_packagingUnitId_fkey" FOREIGN KEY ("packagingUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_packagingOrgUnitId_fkey" FOREIGN KEY ("packagingOrgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDocument" ADD CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDocument" ADD CONSTRAINT "SupplierDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPriceHistory" ADD CONSTRAINT "SupplierPriceHistory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPriceHistory" ADD CONSTRAINT "SupplierPriceHistory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPriceHistory" ADD CONSTRAINT "SupplierPriceHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_parentLocationId_fkey" FOREIGN KEY ("parentLocationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageZone" ADD CONSTRAINT "StorageZone_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageZone" ADD CONSTRAINT "StorageZone_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnit" ADD CONSTRAINT "StorageUnit_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnit" ADD CONSTRAINT "StorageUnit_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "StorageZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnit" ADD CONSTRAINT "StorageUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCTemplate" ADD CONSTRAINT "QCTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCResult" ADD CONSTRAINT "QCResult_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QCTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCResult" ADD CONSTRAINT "QCResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCResult" ADD CONSTRAINT "QCResult_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCResult" ADD CONSTRAINT "QCResult_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCResult" ADD CONSTRAINT "QCResult_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_review" ADD CONSTRAINT "supplier_review_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_review" ADD CONSTRAINT "supplier_review_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_review" ADD CONSTRAINT "supplier_review_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_supplier" ADD CONSTRAINT "favorite_supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_supplier" ADD CONSTRAINT "favorite_supplier_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_supplier" ADD CONSTRAINT "favorite_supplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoragePosition" ADD CONSTRAINT "StoragePosition_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoragePosition" ADD CONSTRAINT "StoragePosition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InvoiceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRAComplianceLog" ADD CONSTRAINT "KRAComplianceLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTemplate" ADD CONSTRAINT "InvoiceTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTemplate" ADD CONSTRAINT "InvoiceTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTemplateVersion" ADD CONSTRAINT "InvoiceTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InvoiceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTemplateVersion" ADD CONSTRAINT "InvoiceTemplateVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateUsageLog" ADD CONSTRAINT "TemplateUsageLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateUsageLog" ADD CONSTRAINT "TemplateUsageLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InvoiceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateUsageLog" ADD CONSTRAINT "TemplateUsageLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateUsageLog" ADD CONSTRAINT "TemplateUsageLog_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_config" ADD CONSTRAINT "invoice_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyRule" ADD CONSTRAINT "LoyaltyRule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyVoucher" ADD CONSTRAINT "LoyaltyVoucher_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyVoucher" ADD CONSTRAINT "LoyaltyVoucher_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "LoyaltyReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyVoucher" ADD CONSTRAINT "LoyaltyVoucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyVoucher" ADD CONSTRAINT "LoyaltyVoucher_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_template" ADD CONSTRAINT "notification_template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_dispatch" ADD CONSTRAINT "notification_dispatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_dispatch" ADD CONSTRAINT "notification_dispatch_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_channel_config" ADD CONSTRAINT "notification_channel_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_activeExpenseWorkflowId_fkey" FOREIGN KEY ("activeExpenseWorkflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_credentials" ADD CONSTRAINT "payment_credentials_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_currentCheckInLocationId_fkey" FOREIGN KEY ("currentCheckInLocationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_currentAttendanceLogId_fkey" FOREIGN KEY ("currentAttendanceLogId") REFERENCES "attendance_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_checkInLocationId_fkey" FOREIGN KEY ("checkInLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_checkOutLocationId_fkey" FOREIGN KEY ("checkOutLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_role" ADD CONSTRAINT "custom_role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_set" ADD CONSTRAINT "permission_set_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_group" ADD CONSTRAINT "role_group_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_headId_fkey" FOREIGN KEY ("headId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_activeBudgetId_fkey" FOREIGN KEY ("activeBudgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_member" ADD CONSTRAINT "department_member_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_member" ADD CONSTRAINT "department_member_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_setup_token" ADD CONSTRAINT "device_setup_token_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_setup_token" ADD CONSTRAINT "device_setup_token_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_setup_token" ADD CONSTRAINT "device_setup_token_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_registry" ADD CONSTRAINT "device_registry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_registry" ADD CONSTRAINT "device_registry_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_registry" ADD CONSTRAINT "device_registry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plane_configuration" ADD CONSTRAINT "plane_configuration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_sellingUnitId_fkey" FOREIGN KEY ("sellingUnitId") REFERENCES "variant_selling_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingBundle" ADD CONSTRAINT "PricingBundle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingBundleItem" ADD CONSTRAINT "PricingBundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "PricingBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingBundleItem" ADD CONSTRAINT "PricingBundleItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_priceListItemId_fkey" FOREIGN KEY ("priceListItemId") REFERENCES "PriceListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceImportJob" ADD CONSTRAINT "PriceImportJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_change_request" ADD CONSTRAINT "price_change_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_change_request" ADD CONSTRAINT "price_change_request_priceListItemId_fkey" FOREIGN KEY ("priceListItemId") REFERENCES "PriceListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scryme_configuration" ADD CONSTRAINT "scryme_configuration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scryme_messages" ADD CONSTRAINT "scryme_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_device" ADD CONSTRAINT "standalone_device_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_device_key" ADD CONSTRAINT "standalone_device_key_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "standalone_device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_rule" ADD CONSTRAINT "reorder_rule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_rule" ADD CONSTRAINT "reorder_rule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_rule" ADD CONSTRAINT "reorder_rule_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_rule" ADD CONSTRAINT "reorder_rule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_rule" ADD CONSTRAINT "reorder_rule_preferredSupplierId_fkey" FOREIGN KEY ("preferredSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_alert" ADD CONSTRAINT "reorder_alert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_alert" ADD CONSTRAINT "reorder_alert_reorderRuleId_fkey" FOREIGN KEY ("reorderRuleId") REFERENCES "reorder_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_audit_log" ADD CONSTRAINT "stock_audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_audit_log" ADD CONSTRAINT "stock_audit_log_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_approval_chain" ADD CONSTRAINT "purchase_approval_chain_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_approval_chain" ADD CONSTRAINT "purchase_approval_chain_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_approval_step" ADD CONSTRAINT "purchase_approval_step_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "purchase_approval_chain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_approval_step" ADD CONSTRAINT "purchase_approval_step_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take" ADD CONSTRAINT "stock_take_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take" ADD CONSTRAINT "stock_take_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take" ADD CONSTRAINT "stock_take_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take" ADD CONSTRAINT "stock_take_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take_item" ADD CONSTRAINT "stock_take_item_stockTakeId_fkey" FOREIGN KEY ("stockTakeId") REFERENCES "stock_take"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take_item" ADD CONSTRAINT "stock_take_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take_item" ADD CONSTRAINT "stock_take_item_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_performance" ADD CONSTRAINT "supplier_performance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_performance" ADD CONSTRAINT "supplier_performance_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_valuation" ADD CONSTRAINT "stock_valuation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_valuation" ADD CONSTRAINT "stock_valuation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_valuation" ADD CONSTRAINT "stock_valuation_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountConfig" ADD CONSTRAINT "CycleCountConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountConfig" ADD CONSTRAINT "CycleCountConfig_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleCountConfig" ADD CONSTRAINT "CycleCountConfig_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "StoragePosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_systemUnitId_fkey" FOREIGN KEY ("systemUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "stock_assembly"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_recallId_fkey" FOREIGN KEY ("recallId") REFERENCES "Recall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantStock" ADD CONSTRAINT "ProductVariantStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantStock" ADD CONSTRAINT "ProductVariantStock_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantStock" ADD CONSTRAINT "ProductVariantStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantStock" ADD CONSTRAINT "ProductVariantStock_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "StockAdjustment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockReceiptId_fkey" FOREIGN KEY ("stockReceiptId") REFERENCES "StockReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_assembly" ADD CONSTRAINT "stock_assembly_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_assembly" ADD CONSTRAINT "stock_assembly_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_assembly" ADD CONSTRAINT "stock_assembly_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_assembly_item" ADD CONSTRAINT "stock_assembly_item_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "stock_assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_assembly_item" ADD CONSTRAINT "stock_assembly_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_assembly_item" ADD CONSTRAINT "stock_assembly_item_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request" ADD CONSTRAINT "stock_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request" ADD CONSTRAINT "stock_request_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request" ADD CONSTRAINT "stock_request_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request" ADD CONSTRAINT "stock_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request" ADD CONSTRAINT "stock_request_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request_item" ADD CONSTRAINT "stock_request_item_stockRequestId_fkey" FOREIGN KEY ("stockRequestId") REFERENCES "stock_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request_item" ADD CONSTRAINT "stock_request_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "stock_transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_qualityCheckedById_fkey" FOREIGN KEY ("qualityCheckedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_shippedById_fkey" FOREIGN KEY ("shippedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_stockRequestId_fkey" FOREIGN KEY ("stockRequestId") REFERENCES "stock_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_report_templates" ADD CONSTRAINT "stock_report_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_report_templates" ADD CONSTRAINT "stock_report_templates_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_stock_reports" ADD CONSTRAINT "generated_stock_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_stock_reports" ADD CONSTRAINT "generated_stock_reports_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "stock_report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_stock_reports" ADD CONSTRAINT "generated_stock_reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_automations" ADD CONSTRAINT "report_automations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_automations" ADD CONSTRAINT "report_automations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "stock_report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_automations" ADD CONSTRAINT "report_automations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_automation_executions" ADD CONSTRAINT "report_automation_executions_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "report_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_automation_executions" ADD CONSTRAINT "report_automation_executions_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "report_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_channels" ADD CONSTRAINT "report_channels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_channels" ADD CONSTRAINT "report_channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReconciliation" ADD CONSTRAINT "StockReconciliation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReconciliation" ADD CONSTRAINT "StockReconciliation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReconciliation" ADD CONSTRAINT "StockReconciliation_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReconciliation" ADD CONSTRAINT "StockReconciliation_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReconciliation" ADD CONSTRAINT "StockReconciliation_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "StockReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementReconciliationLink" ADD CONSTRAINT "MovementReconciliationLink_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "StockReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementReconciliationLink" ADD CONSTRAINT "MovementReconciliationLink_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "StockMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionAuditLog" ADD CONSTRAINT "ActionAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionAuditLog" ADD CONSTRAINT "ActionAuditLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_authority" ADD CONSTRAINT "tax_authority_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax" ADD CONSTRAINT "tax_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax" ADD CONSTRAINT "tax_taxAuthorityId_fkey" FOREIGN KEY ("taxAuthorityId") REFERENCES "tax_authority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_filing" ADD CONSTRAINT "tax_filing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_filing" ADD CONSTRAINT "tax_filing_taxAuthorityId_fkey" FOREIGN KEY ("taxAuthorityId") REFERENCES "tax_authority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_filing" ADD CONSTRAINT "tax_filing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_payment" ADD CONSTRAINT "tax_payment_filingId_fkey" FOREIGN KEY ("filingId") REFERENCES "tax_filing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_payment" ADD CONSTRAINT "tax_payment_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_tax" ADD CONSTRAINT "applied_tax_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_tax" ADD CONSTRAINT "applied_tax_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_expense_tax" ADD CONSTRAINT "applied_expense_tax_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_expense_tax" ADD CONSTRAINT "applied_expense_tax_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_purchase_tax" ADD CONSTRAINT "applied_purchase_tax_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_purchase_tax" ADD CONSTRAINT "applied_purchase_tax_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "delivery_partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_parentTransactionId_fkey" FOREIGN KEY ("parentTransactionId") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_item" ADD CONSTRAINT "transaction_item_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_item" ADD CONSTRAINT "transaction_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_item" ADD CONSTRAINT "transaction_item_sellingUnitId_fkey" FOREIGN KEY ("sellingUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_item" ADD CONSTRAINT "transaction_item_sellingOrgUnitId_fkey" FOREIGN KEY ("sellingOrgUnitId") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocation" ADD CONSTRAINT "inventory_allocation_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocation" ADD CONSTRAINT "inventory_allocation_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocation" ADD CONSTRAINT "inventory_allocation_inventoryLocationId_fkey" FOREIGN KEY ("inventoryLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_cashDrawerId_fkey" FOREIGN KEY ("cashDrawerId") REFERENCES "CashDrawer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unclaimed_payment" ADD CONSTRAINT "unclaimed_payment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_config" ADD CONSTRAINT "receipt_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waybill_config" ADD CONSTRAINT "waybill_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout" ADD CONSTRAINT "payout_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_discount" ADD CONSTRAINT "applied_discount_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_discount" ADD CONSTRAINT "applied_discount_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return" ADD CONSTRAINT "return_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return" ADD CONSTRAINT "return_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return" ADD CONSTRAINT "return_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_item" ADD CONSTRAINT "return_item_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_item" ADD CONSTRAINT "return_item_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_documentMemberId_fkey" FOREIGN KEY ("documentMemberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "fulfillment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDrawer" ADD CONSTRAINT "CashDrawer_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDrawer" ADD CONSTRAINT "CashDrawer_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDrawer" ADD CONSTRAINT "CashDrawer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpesaPaymentRequest" ADD CONSTRAINT "MpesaPaymentRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpesaPaymentRequest" ADD CONSTRAINT "MpesaPaymentRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_unit" ADD CONSTRAINT "organization_unit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_unit" ADD CONSTRAINT "organization_unit_baseSystemUnitId_fkey" FOREIGN KEY ("baseSystemUnitId") REFERENCES "system_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_unit_conversion" ADD CONSTRAINT "org_unit_conversion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_unit_conversion" ADD CONSTRAINT "org_unit_conversion_fromUnitId_fkey" FOREIGN KEY ("fromUnitId") REFERENCES "organization_unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_unit_conversion" ADD CONSTRAINT "org_unit_conversion_toUnitId_fkey" FOREIGN KEY ("toUnitId") REFERENCES "organization_unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_conversion" ADD CONSTRAINT "unit_conversion_fromUnitId_fkey" FOREIGN KEY ("fromUnitId") REFERENCES "system_unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_conversion" ADD CONSTRAINT "unit_conversion_toUnitId_fkey" FOREIGN KEY ("toUnitId") REFERENCES "system_unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_unit_conversion" ADD CONSTRAINT "product_unit_conversion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_unit_conversion" ADD CONSTRAINT "product_unit_conversion_fromUnitId_fkey" FOREIGN KEY ("fromUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_unit_conversion" ADD CONSTRAINT "product_unit_conversion_toUnitId_fkey" FOREIGN KEY ("toUnitId") REFERENCES "system_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_api_client" ADD CONSTRAINT "v3_api_client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_api_client" ADD CONSTRAINT "v3_api_client_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "v3_api_client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_log" ADD CONSTRAINT "webhook_log_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "webhook_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "windmill_configuration" ADD CONSTRAINT "windmill_configuration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "windmill_workflow" ADD CONSTRAINT "windmill_workflow_configId_fkey" FOREIGN KEY ("configId") REFERENCES "windmill_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "windmill_execution" ADD CONSTRAINT "windmill_execution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "windmill_execution" ADD CONSTRAINT "windmill_execution_configId_fkey" FOREIGN KEY ("configId") REFERENCES "windmill_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zitadel_configuration" ADD CONSTRAINT "zitadel_configuration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zitadel_webhook_log" ADD CONSTRAINT "zitadel_webhook_log_configId_fkey" FOREIGN KEY ("configId") REFERENCES "zitadel_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssistantBakerBatches" ADD CONSTRAINT "_AssistantBakerBatches_A_fkey" FOREIGN KEY ("A") REFERENCES "bakery_bakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssistantBakerBatches" ADD CONSTRAINT "_AssistantBakerBatches_B_fkey" FOREIGN KEY ("B") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateAssistantBakers" ADD CONSTRAINT "_TemplateAssistantBakers_A_fkey" FOREIGN KEY ("A") REFERENCES "bakery_bakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateAssistantBakers" ADD CONSTRAINT "_TemplateAssistantBakers_B_fkey" FOREIGN KEY ("B") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToPriceList" ADD CONSTRAINT "_CustomerToPriceList_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToPriceList" ADD CONSTRAINT "_CustomerToPriceList_B_fkey" FOREIGN KEY ("B") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessAccountToPriceList" ADD CONSTRAINT "_BusinessAccountToPriceList_A_fkey" FOREIGN KEY ("A") REFERENCES "business_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessAccountToPriceList" ADD CONSTRAINT "_BusinessAccountToPriceList_B_fkey" FOREIGN KEY ("B") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpenseApprovalWorkflows" ADD CONSTRAINT "_ExpenseApprovalWorkflows_A_fkey" FOREIGN KEY ("A") REFERENCES "ApprovalWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpenseApprovalWorkflows" ADD CONSTRAINT "_ExpenseApprovalWorkflows_B_fkey" FOREIGN KEY ("B") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VariantQCTemplates" ADD CONSTRAINT "_VariantQCTemplates_A_fkey" FOREIGN KEY ("A") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VariantQCTemplates" ADD CONSTRAINT "_VariantQCTemplates_B_fkey" FOREIGN KEY ("B") REFERENCES "QCTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberRoleGroups" ADD CONSTRAINT "_MemberRoleGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberRoleGroups" ADD CONSTRAINT "_MemberRoleGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "role_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberCustomRoles" ADD CONSTRAINT "_MemberCustomRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "custom_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberCustomRoles" ADD CONSTRAINT "_MemberCustomRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleGroupPermissionSets" ADD CONSTRAINT "_RoleGroupPermissionSets_A_fkey" FOREIGN KEY ("A") REFERENCES "permission_set"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleGroupPermissionSets" ADD CONSTRAINT "_RoleGroupPermissionSets_B_fkey" FOREIGN KEY ("B") REFERENCES "role_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MovementSerialNumbers" ADD CONSTRAINT "_MovementSerialNumbers_A_fkey" FOREIGN KEY ("A") REFERENCES "SerialNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MovementSerialNumbers" ADD CONSTRAINT "_MovementSerialNumbers_B_fkey" FOREIGN KEY ("B") REFERENCES "StockMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutomationChannels" ADD CONSTRAINT "_AutomationChannels_A_fkey" FOREIGN KEY ("A") REFERENCES "report_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutomationChannels" ADD CONSTRAINT "_AutomationChannels_B_fkey" FOREIGN KEY ("B") REFERENCES "report_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
