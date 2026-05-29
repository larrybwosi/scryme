'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Lock, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/ui/tooltip';
import { cn } from '@repo/ui/lib/utils';

// CRM-specific permission types
export const CRM_PERMISSIONS = {
  // General CRM access
  CRM_VIEW: 'crm:view',
  CRM_MANAGE: 'crm:manage',

  // Object management
  OBJECT_CREATE: 'crm_object:create',
  OBJECT_VIEW: 'crm_object:view',
  OBJECT_EDIT: 'crm_object:edit',
  OBJECT_DELETE: 'crm_object:delete',
  OBJECT_MANAGE: 'crm_object:manage',

  // Record management
  RECORD_CREATE: 'crm_record:create',
  RECORD_VIEW: 'crm_record:view',
  RECORD_VIEW_OWN: 'crm_record:view:own',
  RECORD_EDIT: 'crm_record:edit',
  RECORD_DELETE: 'crm_record:delete',
  RECORD_MANAGE: 'crm_record:manage',
  RECORD_MANAGE_OWN: 'crm_record:manage:own',

  // Pipeline management
  PIPELINE_VIEW: 'crm_pipeline:view',
  PIPELINE_EDIT: 'crm_pipeline:edit',
  PIPELINE_MANAGE: 'crm_pipeline:manage',

  // Analytics
  ANALYTICS_VIEW: 'crm_analytics:view',
  ANALYTICS_GENERATE: 'crm_analytics:generate',

  // Webhooks
  WEBHOOK_CREATE: 'crm_webhook:create',
  WEBHOOK_VIEW: 'crm_webhook:view',
  WEBHOOK_EDIT: 'crm_webhook:edit',
  WEBHOOK_DELETE: 'crm_webhook:delete',
  WEBHOOK_MANAGE: 'crm_webhook:manage',
} as const;

export type CrmPermission = (typeof CRM_PERMISSIONS)[keyof typeof CRM_PERMISSIONS];

// Context for CRM permissions
interface CrmPermissionsContextValue {
  permissions: string[];
  hasPermission: (permission: string | string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: boolean;
  userId?: string;
  organizationId?: string;
}

const CrmPermissionsContext = createContext<CrmPermissionsContextValue | null>(null);

export const useCrmPermissions = () => {
  const context = useContext(CrmPermissionsContext);
  if (!context) {
    throw new Error('useCrmPermissions must be used within CrmPermissionsProvider');
  }
  return context;
};

interface CrmPermissionsProviderProps {
  children: React.ReactNode;
  permissions: string[];
  userId?: string;
  organizationId?: string;
}

export const CrmPermissionsProvider: React.FC<CrmPermissionsProviderProps> = ({
  children,
  permissions,
  userId,
  organizationId,
}) => {
  const value = useMemo<CrmPermissionsContextValue>(() => {
    const isAdmin = permissions.includes('*') || permissions.includes('crm:manage');

    const hasPermission = (permission: string | string[]): boolean => {
      if (isAdmin) return true;
      if (Array.isArray(permission)) {
        return permission.some(p => permissions.includes(p));
      }
      return permissions.includes(permission);
    };

    const hasAnyPermission = (perms: string[]): boolean => {
      if (isAdmin) return true;
      return perms.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (perms: string[]): boolean => {
      if (isAdmin) return true;
      return perms.every(p => permissions.includes(p));
    };

    return {
      permissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isAdmin,
      userId,
      organizationId,
    };
  }, [permissions, userId, organizationId]);

  return <CrmPermissionsContext.Provider value={value}>{children}</CrmPermissionsContext.Provider>;
};

// Permission guard component
interface CrmPermissionGuardProps {
  children: React.ReactNode;
  permission: string | string[];
  mode?: 'any' | 'all';
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export const CrmPermissionGuard: React.FC<CrmPermissionGuardProps> = ({
  children,
  permission,
  mode = 'any',
  fallback,
  showAccessDenied = false,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useCrmPermissions();

  const hasAccess = useMemo(() => {
    if (Array.isArray(permission)) {
      return mode === 'all' ? hasAllPermissions(permission) : hasAnyPermission(permission);
    }
    return hasPermission(permission);
  }, [permission, mode, hasPermission, hasAnyPermission, hasAllPermissions]);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAccessDenied) {
    return (
      <Alert variant="destructive" className="my-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don&apos;t have permission to access this feature. Contact your administrator for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

// Protected button wrapper
interface CrmProtectedButtonProps {
  children: React.ReactNode;
  permission: string | string[];
  mode?: 'any' | 'all';
  disabledMessage?: string;
}

export const CrmProtectedButton: React.FC<CrmProtectedButtonProps> = ({
  children,
  permission,
  mode = 'any',
  disabledMessage = 'You do not have permission to perform this action',
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useCrmPermissions();

  const hasAccess = useMemo(() => {
    if (Array.isArray(permission)) {
      return mode === 'all' ? hasAllPermissions(permission) : hasAnyPermission(permission);
    }
    return hasPermission(permission);
  }, [permission, mode, hasPermission, hasAnyPermission, hasAllPermissions]);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Clone the button with disabled state
  if (React.isValidElement(children)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block cursor-not-allowed">
              {React.cloneElement(children as React.ReactElement<any>, {
                disabled: true,
                className: cn((children.props as any).className, 'pointer-events-none opacity-50'),
              })}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              <span>{disabledMessage}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};

// Access level indicator
interface CrmAccessLevelProps {
  className?: string;
}

export const CrmAccessLevel: React.FC<CrmAccessLevelProps> = ({ className }) => {
  const { isAdmin, hasPermission } = useCrmPermissions();

  const level = useMemo(() => {
    if (isAdmin) return { label: 'Full Access', color: 'bg-emerald-500', icon: Shield };
    if (hasPermission(CRM_PERMISSIONS.RECORD_MANAGE)) {
      return { label: 'Manager', color: 'bg-blue-500', icon: Shield };
    }
    if (hasPermission([CRM_PERMISSIONS.RECORD_VIEW, CRM_PERMISSIONS.RECORD_VIEW_OWN])) {
      return { label: 'Viewer', color: 'bg-amber-500', icon: AlertTriangle };
    }
    return { label: 'Limited', color: 'bg-zinc-400', icon: Lock };
  }, [isAdmin, hasPermission]);

  const _Icon = level.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('h-2 w-2 rounded-full', level.color)} />
      <span className="text-xs font-medium text-muted-foreground">{level.label}</span>
    </div>
  );
};

// Hook to check record ownership
export const useRecordOwnership = (recordOwnerId?: string, recordCreatedBy?: string) => {
  const { userId, hasPermission, isAdmin } = useCrmPermissions();

  return useMemo(() => {
    const isOwner = recordOwnerId === userId || recordCreatedBy === userId;
    const canViewOwn = hasPermission(CRM_PERMISSIONS.RECORD_VIEW_OWN);
    const canViewAll = hasPermission(CRM_PERMISSIONS.RECORD_VIEW);
    const canManageOwn = hasPermission(CRM_PERMISSIONS.RECORD_MANAGE_OWN);
    const canManageAll = hasPermission(CRM_PERMISSIONS.RECORD_MANAGE);

    return {
      isOwner,
      canView: isAdmin || canViewAll || (canViewOwn && isOwner),
      canEdit: isAdmin || canManageAll || (canManageOwn && isOwner),
      canDelete: isAdmin || canManageAll || (canManageOwn && isOwner),
    };
  }, [userId, recordOwnerId, recordCreatedBy, hasPermission, isAdmin]);
};

export default CrmPermissionGuard;
