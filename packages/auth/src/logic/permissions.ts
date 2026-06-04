import { RESOURCES, PERMISSION_ACTIONS } from '../permissions/constants';

/**
 * Creates a standard permission string
 */
export function formatPermission(resource: string, action: string, scope?: string): string {
    if (action === PERMISSION_ACTIONS.ALL) {
        return `${resource}:*`;
    }
    return scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`;
}

/**
 * Parses a permission string into its components
 */
export function parsePermission(permission: string) {
    const parts = permission.split(':');
    return {
        resource: parts[0],
        action: parts[1] || PERMISSION_ACTIONS.VIEW,
        scope: parts[2] || null
    };
}
