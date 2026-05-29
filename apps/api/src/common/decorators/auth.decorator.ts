import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
export const RequirePermission = Permissions; // Alias for convenience

export const SCOPES_KEY = 'scopes';
export const Scopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);

export const ALLOW_PUBLIC_KEY = 'allowPublic';
export const AllowPublic = () => SetMetadata(ALLOW_PUBLIC_KEY, true);
