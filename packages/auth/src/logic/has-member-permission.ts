/**
 * Checks if a member role has permission to perform a specific action
 * @param role - The member's role within the organization
 * @param action - The action to check permission for
 * @returns boolean - true if allowed, false if not
 */
export function hasMemberPermission(role: string, action: string) {
    // Define permissions for each member role
    const permissions: Record<string, string[]> = {
        OWNER: [
            'manage_organization', 'delete_organization', 'update_organization_settings',
            'invite_members', 'manage_members', 'remove_members', 'update_member_roles',
            'create_products', 'update_products', 'delete_products', 'manage_categories',
            'manage_inventory', 'adjust_stock', 'transfer_stock', 'view_inventory_reports',
            'create_sales', 'view_sales', 'refund_sales', 'manage_customers',
            'create_purchases', 'approve_purchases', 'receive_purchases', 'manage_suppliers',
            'manage_cash_drawers', 'view_financial_reports', 'export_financial_data',
            'manage_automations', 'view_audit_logs', 'manage_assistants',
            'manage_attendance', 'view_attendance_reports', 'manage_schedules'
        ],
        ADMIN: [
            'manage_organization', 'update_organization_settings',
            'invite_members', 'manage_members', 'remove_members', 'update_member_roles',
            'create_products', 'update_products', 'delete_products', 'manage_categories',
            'manage_inventory', 'adjust_stock', 'transfer_stock', 'view_inventory_reports',
            'create_sales', 'view_sales', 'refund_sales', 'manage_customers',
            'create_purchases', 'approve_purchases', 'receive_purchases', 'manage_suppliers',
            'manage_cash_drawers', 'view_financial_reports', 'export_financial_data',
            'manage_automations', 'view_audit_logs', 'manage_assistants',
            'manage_attendance', 'view_attendance_reports', 'manage_schedules'
        ],
        MANAGER: [
            'create_products', 'update_products', 'manage_categories',
            'manage_inventory', 'adjust_stock', 'transfer_stock', 'view_inventory_reports',
            'create_sales', 'view_sales', 'refund_sales', 'manage_customers',
            'create_purchases', 'receive_purchases', 'manage_suppliers',
            'manage_cash_drawers', 'view_financial_reports',
            'manage_attendance', 'view_attendance_reports', 'manage_schedules'
        ],
        EMPLOYEE: [
            'create_sales', 'view_sales', 'manage_customers',
            'view_inventory_reports'
        ],
        CASHIER: [
            'create_sales', 'view_sales'
        ],
        REPORTER: [
            'view_sales', 'view_inventory_reports', 'view_financial_reports',
            'view_attendance_reports'
        ],
        GUEST: []
    };
    // Check if the action is allowed for the role
    return (permissions[role] || []).includes(action);
}
