import { db } from "@repo/db";
import { PERMISSION_ACTIONS } from "../permissions/constants";
import { parsePermission } from "./permissions";
// These should be imported from a config file or passed in
const CONFIG = {
    MAX_FAILED_ATTEMPTS: 5,
    FAILED_ATTEMPT_TTL: 3600, // 1 hour
    BAN_TTL: 86400, // 24 hours
};
export class PermissionError extends Error {
    message;
    attempts;
    isBanned;
    constructor(message, attempts, isBanned) {
        super(message);
        this.message = message;
        this.attempts = attempts;
        this.isBanned = isBanned;
        this.name = "PermissionError";
    }
}
/**
 * Validates if a user with a set of permissions can perform an action
 */
export function checkPermission(userPermissions, requiredPermission) {
    if (userPermissions.includes("*") || userPermissions.includes("*:*")) {
        return true;
    }
    const required = parsePermission(requiredPermission);
    return userPermissions.some((p) => {
        const user = parsePermission(p);
        // Exact match
        if (p === requiredPermission)
            return true;
        // Resource wildcard
        if (user.resource === required.resource &&
            user.action === PERMISSION_ACTIONS.ALL) {
            return true;
        }
        return false;
    });
}
export async function checkPermissionLogic(context, permission, redisClient) {
    const { memberId, organizationId, userId, role } = context;
    // 1. Check for ban
    const banKey = `auth:ban:${memberId}`;
    if (await redisClient.get(banKey)) {
        throw new PermissionError("Access blocked: Too many failed authorization attempts.", CONFIG.MAX_FAILED_ATTEMPTS, true);
    }
    // 2. Check permission
    if (!context.hasPermission(permission.resource)) {
        const failedAttemptsKey = `auth:failed-attempts:${memberId}:${permission}`;
        // Increment failure count atomically
        const attempts = await redisClient.incr(failedAttemptsKey);
        if (attempts === 1) {
            // Set TTL on the first failure
            await redisClient.expire(failedAttemptsKey, CONFIG.FAILED_ATTEMPT_TTL);
        }
        // 3. Handle ban
        if (attempts >= CONFIG.MAX_FAILED_ATTEMPTS) {
            await redisClient.setex(banKey, CONFIG.BAN_TTL, "banned");
            // We can run this in the background
            db.user
                .update({
                where: { id: userId },
                data: {
                    banned: true,
                    banReason: "Exceeded permission request limit.",
                },
            })
                .catch((err) => console.error("Failed to update user ban status:", err));
            throw new PermissionError(`Forbidden: Permission '${permission}' denied. Your account is now temporarily blocked.`, attempts, true);
        }
        // 4. Create audit log (run in background)
        db.auditLog
            .create({
            data: {
                organizationId: organizationId,
                memberId: memberId,
                action: "ACCESS_DENIED",
                entityType: "AUTH_CHECK",
                entityId: memberId,
                description: `Permission '${permission}' denied for member ${memberId} (Role: ${role}). Attempt ${attempts}/${CONFIG.MAX_FAILED_ATTEMPTS}.`,
                details: JSON.stringify({
                    requestedPermission: permission,
                    heldPermissions: Array.from(context.permissions),
                }),
            },
        })
            .catch((err) => console.error("Failed to create audit log:", err));
        // 5. Throw standard denial
        throw new PermissionError(`Forbidden: You do not have the required permission: '${permission}'`, attempts, false);
    }
    // 6. On success, reset failure counter for this specific permission
    const failedAttemptsKey = `auth:failed-attempts:${memberId}:${permission}`;
    redisClient
        .del(failedAttemptsKey)
        .catch((err) => console.error("Failed to clear failed attempts key:", err));
}
