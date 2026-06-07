/**
 * Available actions in the permission system
 */
export const PERMISSION_ACTIONS = {
    CREATE: 'create',
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    MANAGE: 'manage',
    APPROVE: 'approve',
    SUBMIT: 'submit',
    GENERATE: 'generate',
    VIEW_OWN: 'view:own',
    MANAGE_OWN: 'manage:own',
    CREATE_OWN: 'create:own',
    ALL: '*',
};
/**
 * Resource modules in the ERP system
 */
export const RESOURCES = {
    ORGANIZATION: 'organization',
    PRODUCT: 'product',
    SALE: 'sale',
    PURCHASE: 'purchase',
    INVENTORY: 'inventory',
    CUSTOMER: 'customer',
    SUPPLIER: 'supplier',
    FINANCE: 'finance',
    EXPENSE: 'expense',
    BUDGET: 'budget',
    REPORT: 'report',
    MEMBER: 'member',
    ROLE: 'role',
    DEPARTMENT: 'department',
    AUDIT: 'audit',
    ORDER: 'order',
    RETURN: 'return',
    CASH_DRAWER: 'cashdrawer',
    CATEGORY: 'category',
    LOCATION: 'location',
    STORAGE: 'storage',
    STOCK: 'stock',
    TAX: 'tax',
    FISCAL_PERIOD: 'fiscalperiod',
    ATTENDANCE: 'attendance',
    DELIVERY: 'delivery',
    DRIVER: 'driver',
    VEHICLE: 'vehicle',
    MANUFACTURING: 'manufacturing',
    RAW_MATERIAL: 'rawmaterial',
    LOYALTY: 'loyalty',
    REFERRAL: 'referral',
    CHANNEL: 'channel',
    ASSISTANT: 'assistant',
    API_KEY: 'apikey',
    BACKUP: 'backup',
    INVOICE: 'invoice',
    PAYMENT: 'payment',
    PRICING: 'pricing',
    BAKERY: 'bakery',
    WORKSPACE: 'workspace',
    HULY: 'huly',
    UTILITY: 'utility',
};
/**
 * Helper function to create permission strings
 */
export const createPermission = (resource: string, action: string, scope?: string) => {
    return scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`;
};
/**
 * Exhaustive list of permission strings for common use cases
 */
export const PERMISSIONS = {
    // Organization Management
    ORGANIZATION_VIEW_SETTINGS: 'organization:view:settings',
    ORGANIZATION_UPDATE_SETTINGS: 'organization:update:settings',
    ORGANIZATION_VIEW_MEMBERS: 'organization:view:members',
    ORGANIZATION_MANAGE_CUSTOM_ROLES: 'organization:manage:custom_roles',
    ORGANIZATION_ASSIGN_CUSTOM_ROLES: 'organization:assign:custom_roles',
    ORGANIZATION_VIEW_AUDIT_LOGS: 'organization:view:audit_logs',
    // Member Management
    MEMBER_INVITE: 'member:invite',
    MEMBER_REMOVE: 'member:remove',
    MEMBER_UPDATE_ROLE: 'member:update:role',
    MEMBER_VIEW_PROFILE: 'member:view:profile',
    MEMBER_UPDATE_OWN_PROFILE: 'member:update:own:profile',
    // Product Management
    PRODUCT_CREATE: 'product:create',
    PRODUCT_READ_ALL: 'product:read:all',
    PRODUCT_READ_ASSIGNED: 'product:read:assigned',
    PRODUCT_UPDATE: 'product:update',
    PRODUCT_DELETE: 'product:delete',
    PRODUCT_MANAGE_CATEGORIES: 'product:manage:categories',
    PRODUCT_MANAGE_STOCK: 'product:manage:stock',
    PRODUCT_VIEW_STOCK_LEVELS: 'product:view:stock_levels',
    // Sales Management
    SALE_CREATE: 'sale:create',
    SALE_READ_ALL: 'sale:read:all',
    SALE_READ_OWN: 'sale:read:own',
    SALE_READ_LOCATION: 'sale:read:location',
    SALE_UPDATE: 'sale:update',
    SALE_VOID: 'sale:void',
    SALE_PROCESS_RETURN: 'sale:process:return',
    // Purchase Management
    PURCHASE_CREATE: 'purchase:create',
    PURCHASE_READ_ALL: 'purchase:read:all',
    PURCHASE_UPDATE_STATUS: 'purchase:update:status',
    PURCHASE_APPROVE: 'purchase:approve',
    // Customer Management
    CUSTOMER_CREATE: 'customer:create',
    CUSTOMER_READ_ALL: 'customer:read:all',
    CUSTOMER_UPDATE: 'customer:update',
    CUSTOMER_DELETE: 'customer:delete',
    CUSTOMER_MANAGE_LOYALTY: 'customer:manage:loyalty',
    // Inventory Location Management
    INVENTORY_LOCATION_CREATE: 'inventory_location:create',
    INVENTORY_LOCATION_READ_ALL: 'inventory_location:read:all',
    INVENTORY_LOCATION_UPDATE: 'inventory_location:update',
    INVENTORY_LOCATION_DELETE: 'inventory_location:delete',
    // Cash Drawer Management
    CASHDRAWER_OPEN: 'cashdrawer:open',
    CASHDRAWER_CLOSE: 'cashdrawer:close',
    CASHDRAWER_VIEW_ALL: 'cashdrawer:view:all',
    CASHDRAWER_VIEW_OWN: 'cashdrawer:view:own',
    // Reporting
    REPORT_VIEW_SALES: 'report:view:sales',
    REPORT_VIEW_INVENTORY: 'report:view:inventory',
    REPORT_VIEW_FINANCIAL: 'report:view:financial',
    // Expense Management
    EXPENSE_CREATE_OWN: 'expense:create:own',
    EXPENSE_CREATE_FOR_OTHERS: 'expense:create:for_others',
    EXPENSE_READ_OWN: 'expense:read:own',
    EXPENSE_READ_TEAM: 'expense:read:team',
    EXPENSE_READ_ALL: 'expense:read:all',
    EXPENSE_APPROVE: 'expense:approve',
    EXPENSE_MANAGE_CATEGORIES: 'expense:manage:categories',
    EXPENSE_MANAGE_SETTINGS: 'expense:manage:settings',
    // Budget Management
    BUDGET_CREATE: 'budget:create',
    BUDGET_READ_ALL: 'budget:read:all',
    BUDGET_UPDATE: 'budget:update',
    BUDGET_DELETE: 'budget:delete',
    BUDGET_VIEW_REPORTS: 'budget:view:reports',
    // Attendance Management
    ATTENDANCE_CHECK_IN_OUT_OWN: 'attendance:check_in_out:own',
    ATTENDANCE_VIEW_OWN_LOGS: 'attendance:view:own:logs',
    ATTENDANCE_VIEW_TEAM_LOGS: 'attendance:view:team:logs',
    ATTENDANCE_VIEW_ALL_LOGS: 'attendance:view:all:logs',
    ATTENDANCE_MANAGE_SETTINGS: 'attendance:manage:settings',
    ATTENDANCE_MANUAL_ENTRY: 'attendance:manual:entry',
    // Assistant Management
    ASSISTANT_MANAGE_CONFIGURATION: 'assistant:manage:configuration',
    ASSISTANT_VIEW_LOGS: 'assistant:view:logs',
    ASSISTANT_INTERACT: 'assistant:interact',
    // Communication
    CHANNEL_MANAGE_ANY: 'channel:manage:any',
    CHANNEL_SEND_MESSAGES: 'channel:send:messages',
    CHANNEL_JOIN_PUBLIC: 'channel:join:public',
    // Printer Settings Management
    PRINTER_SETTINGS_MANAGE: 'printer_settings:manage',
    // API Key Management
    API_KEY_VIEW: 'api_key:view',
    API_KEY_MANAGE: 'api_key:manage',
};
