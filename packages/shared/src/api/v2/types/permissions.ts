export const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ['*'],
  ADMIN: ['*'],
  MANAGER: [
    'product:read:all',
    'product:manage:stock',
    'product:view:stock_levels',
    'sale:read:location',
    'inventory_location:read:all',
    'bakery:recipe:view',
    'bakery:batch:view',
    'bakery:batch:manage',
    'bakery:template:view',
  ],
  BAKER: [
    'bakery:recipe:view',
    'bakery:batch:view',
    'bakery:batch:manage',
    'bakery:template:view',
    'product:view:stock_levels',
  ],
  STAFF: ['sale:create', 'product:read:all', 'product:view:stock_levels', 'customer:read:all'],
};
