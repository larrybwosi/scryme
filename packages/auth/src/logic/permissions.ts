import { PERMISSION_ACTIONS } from '../permissions/constants';
/**
 * Creates a standard permission string
 */
export function formatPermission(resource, action, scope) {
    if (action === PERMISSION_ACTIONS.ALL) {
        return `${resource}:*`;
    }
    return scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`;
}
/**
 * Parses a permission string into its components
 */
export function parsePermission(permission) {
    const parts = permission.split(':');
    return {
        resource: parts[0],
        action: parts[1] || PERMISSION_ACTIONS.VIEW,
        scope: parts[2] || null
    };
}
