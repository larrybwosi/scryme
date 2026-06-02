import { PERMISSION_ACTIONS } from '../permissions/constants';
import { parsePermission } from './permissions';
/**
 * Validates if a user with a set of permissions can perform an action
 */
export function checkPermission(userPermissions, requiredPermission) {
    if (userPermissions.includes('*') || userPermissions.includes('*:*')) {
        return true;
    }
    const required = parsePermission(requiredPermission);
    return userPermissions.some(p => {
        const user = parsePermission(p);
        // Exact match
        if (p === requiredPermission)
            return true;
        // Resource wildcard
        if (user.resource === required.resource && user.action === PERMISSION_ACTIONS.ALL) {
            return true;
        }
        return false;
    });
}
