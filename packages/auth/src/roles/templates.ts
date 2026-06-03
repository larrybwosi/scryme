// @ts-nocheck
// @ts-nocheck
import { createPermission, PERMISSION_ACTIONS, RESOURCES } from '../permissions/constants';
import { PERMISSION_DEFINITIONS } from '../permissions/definitions';
/**
 * Comprehensive role templates that organizations can use to create custom roles
 */
export const ROLE_TEMPLATES = [
    // Executive Level
    {
        id: 'owner',
        name: 'Owner',
        description: 'Complete system access with full control over all modules and settings',
        category: 'executive',
        permissions: [PERMISSION_ACTIONS.ALL],
        isCustomizable: false,
        icon: '👑',
    },
    {
        id: 'ceo',
        name: 'CEO / Managing Director',
        description: 'Executive oversight with access to all reports, analytics, and strategic decision-making data',
        category: 'executive',
        permissions: [
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.GENERATE, undefined),
            createPermission(RESOURCES.AUDIT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.FINANCE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.BUDGET, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.MEMBER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.DEPARTMENT, PERMISSION_ACTIONS.MANAGE, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.INVENTORY, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '🎯',
    },
    // Administrative
    {
        id: 'admin',
        name: 'System Administrator',
        description: 'Full administrative access to manage users, roles, and system configuration',
        category: 'management',
        permissions: [
            ...PERMISSION_DEFINITIONS.organization,
            ...PERMISSION_DEFINITIONS.members,
            ...PERMISSION_DEFINITIONS.products,
            ...PERMISSION_DEFINITIONS.sales,
            ...PERMISSION_DEFINITIONS.customers,
            ...PERMISSION_DEFINITIONS.purchases,
            ...PERMISSION_DEFINITIONS.inventory,
            ...PERMISSION_DEFINITIONS.finance,
            ...PERMISSION_DEFINITIONS.expenses,
            ...PERMISSION_DEFINITIONS.reports,
            ...PERMISSION_DEFINITIONS.hr,
            ...PERMISSION_DEFINITIONS.communication,
        ],
        isCustomizable: false,
        icon: '⚙️',
    },
    {
        id: 'operations_manager',
        name: 'Operations Manager',
        description: 'Oversee daily operations including sales, inventory, and team management',
        category: 'management',
        permissions: [
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.MANAGE, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.APPROVE, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.APPROVE, undefined),
            createPermission(RESOURCES.INVENTORY, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.MANAGE, undefined),
            createPermission(RESOURCES.SUPPLIER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.SUPPLIER, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.SUPPLIER, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.SUPPLIER, PERMISSION_ACTIONS.MANAGE, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '📋',
    },
    {
        id: 'purchasing_officer',
        name: 'Purchasing Officer',
        description: 'Create purchase orders and coordinate with suppliers',
        category: 'operations',
        permissions: [
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.SUPPLIER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.SUPPLIER, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.INVENTORY, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '🛍️',
    },
    // Logistics & Delivery
    {
        id: 'logistics_manager',
        name: 'Logistics Manager',
        description: 'Oversee delivery operations, fleet management, and driver coordination',
        category: 'logistics',
        permissions: [
            ...PERMISSION_DEFINITIONS.logistics,
            createPermission(RESOURCES.INVENTORY, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.ORDER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.ORDER, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.GENERATE, undefined),
        ],
        isCustomizable: true,
        icon: '🚚',
    },
    {
        id: 'delivery_driver',
        name: 'Delivery Driver',
        description: 'View and update delivery assignments and status',
        category: 'logistics',
        permissions: [
            createPermission(RESOURCES.DELIVERY, PERMISSION_ACTIONS.VIEW_OWN, undefined),
            createPermission(RESOURCES.DELIVERY, PERMISSION_ACTIONS.MANAGE_OWN, undefined),
            createPermission(RESOURCES.ORDER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.CUSTOMER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.VEHICLE, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '🚗',
    },
    // Human Resources
    {
        id: 'hr_manager',
        name: 'HR Manager',
        description: 'Manage employee records, attendance, and HR processes',
        category: 'hr',
        permissions: [
            ...PERMISSION_DEFINITIONS.hr,
            createPermission(RESOURCES.MEMBER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.MEMBER, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.MEMBER, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.DEPARTMENT, PERMISSION_ACTIONS.MANAGE, undefined),
            createPermission(RESOURCES.EXPENSE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.EXPENSE, PERMISSION_ACTIONS.APPROVE, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.GENERATE, undefined),
        ],
        isCustomizable: true,
        icon: '👥',
    },
    {
        id: 'hr_assistant',
        name: 'HR Assistant',
        description: 'Support HR operations including attendance tracking and record maintenance',
        category: 'hr',
        permissions: [
            createPermission(RESOURCES.ATTENDANCE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.ATTENDANCE, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.MEMBER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.EXPENSE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '📝',
    },
    // Manufacturing & Production
    {
        id: 'production_manager',
        name: 'Production Manager',
        description: 'Oversee manufacturing operations, batches, and production planning',
        category: 'operations',
        permissions: [
            createPermission(RESOURCES.MANUFACTURING, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.MANUFACTURING, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.MANUFACTURING, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.MANUFACTURING, PERMISSION_ACTIONS.MANAGE, undefined),
            createPermission(RESOURCES.RAW_MATERIAL, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.RAW_MATERIAL, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.RAW_MATERIAL, PERMISSION_ACTIONS.MANAGE, undefined),
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.INVENTORY, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '⚙️',
    },
    {
        id: 'production_worker',
        name: 'Production Worker',
        description: 'Update production batches and view manufacturing instructions',
        category: 'operations',
        permissions: [
            createPermission(RESOURCES.MANUFACTURING, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.MANUFACTURING, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.RAW_MATERIAL, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '🔧',
    },
    // Technical & IT
    {
        id: 'it_administrator',
        name: 'IT Administrator',
        description: 'Manage system integrations, API keys, and technical configurations',
        category: 'technical',
        permissions: [
            ...PERMISSION_DEFINITIONS.automation,
            createPermission(RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.EDIT, undefined),
            createPermission(RESOURCES.BACKUP, PERMISSION_ACTIONS.MANAGE, undefined),
            createPermission(RESOURCES.AUDIT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.MEMBER, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '💻',
    },
    {
        id: 'data_analyst',
        name: 'Data Analyst',
        description: 'Access and analyze data across all modules for insights',
        category: 'technical',
        permissions: [
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.GENERATE, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.INVENTORY, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.CUSTOMER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.FINANCE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.AUDIT, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '📊',
    },
    // Basic/Standard Roles
    {
        id: 'employee',
        name: 'Employee',
        description: 'Basic employee access for daily tasks and personal records',
        category: 'operations',
        permissions: [
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.VIEW_OWN, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.CUSTOMER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.CUSTOMER, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.EXPENSE, PERMISSION_ACTIONS.CREATE, undefined),
            createPermission(RESOURCES.EXPENSE, PERMISSION_ACTIONS.VIEW_OWN, undefined),
            createPermission(RESOURCES.EXPENSE, PERMISSION_ACTIONS.SUBMIT, undefined),
            createPermission(RESOURCES.ATTENDANCE, PERMISSION_ACTIONS.VIEW_OWN, undefined),
        ],
        isCustomizable: true,
        icon: '👤',
    },
    {
        id: 'auditor',
        name: 'Auditor',
        description: 'Read-only access to review transactions and system activity',
        category: 'finance',
        permissions: [
            createPermission(RESOURCES.AUDIT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.FINANCE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.PURCHASE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.EXPENSE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.INVENTORY, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.GENERATE, undefined),
        ],
        isCustomizable: true,
        icon: '🔍',
    },
    {
        id: 'read_only',
        name: 'Read-Only User',
        description: 'View-only access across most modules without modification rights',
        category: 'custom',
        permissions: [
            createPermission(RESOURCES.PRODUCT, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.SALE, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.CUSTOMER, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.INVENTORY, PERMISSION_ACTIONS.VIEW, undefined),
            createPermission(RESOURCES.REPORT, PERMISSION_ACTIONS.VIEW, undefined),
        ],
        isCustomizable: true,
        icon: '👁️',
    },
];
/**
 * Get role templates by category
 */
export const getRoleTemplatesByCategory = (category) => {
    return ROLE_TEMPLATES.filter(template => template.category === category);
};
/**
 * Get a specific role template by id
 */
export const getRoleTemplateById = (id) => {
    return ROLE_TEMPLATES.find(template => template.id === id);
};
/**
 * Get all role template categories
 */
export const getRoleCategories = () => {
    return ['executive', 'management', 'operations', 'finance', 'sales', 'logistics', 'hr', 'technical', 'custom'];
};
