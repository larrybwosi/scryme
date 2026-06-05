import { ScrymeClient, ScrymeConfig } from './core/client';
import { ScrymeV2 } from './v2';
import { ScrymeV3 } from './v3';

export * from './core/client';
export * from './v2';
export * from './v3';
export * from './core/pagination';

// Re-export essential types from @repo/db for consumer convenience
export type {
  StockBatch,
  ProductVariant,
  Transaction,
  Member,
  AttendanceLog,
  Department,
  Invitation,
  Organization,
  Category,
  Product,
  Supplier,
  InventoryLocation,
  Batch,
  Recipe
} from '@repo/db';

// Export Prisma to avoid "non-portable type" errors in consumers
export { Prisma } from '@repo/db';

export class Scryme {
  private readonly client: ScrymeClient;
  public readonly v2: ScrymeV2;
  public readonly v3: ScrymeV3;

  constructor(config: ScrymeConfig) {
    this.client = new ScrymeClient(config);
    this.v2 = new ScrymeV2(this.client);
    this.v3 = new ScrymeV3(this.client);
  }

  /**
   * For backward compatibility with the old getSDK function
   */
  public static getSDK(config: ScrymeConfig) {
    const scryme = new Scryme(config);

    // Return a proxy that combines v2 and client methods for legacy support
    return {
      ...scryme.v2,
      v2: scryme.v2,
      v3: scryme.v3,
      client: {
        getBaseURL: () => scryme.client.getBaseURL(),
        setBaseURL: (url: string) => {
          scryme.client.setBaseURL(url);
        },
        get: scryme.client.get.bind(scryme.client),
        post: scryme.client.post.bind(scryme.client),
        put: scryme.client.put.bind(scryme.client),
        patch: scryme.client.patch.bind(scryme.client),
        delete: scryme.client.delete.bind(scryme.client),
      },
      setApiKey: scryme.client.setApiKey.bind(scryme.client),
    };
  }
}

// Deprecated: use new Scryme(config) or Scryme.getSDK(config)
export const getSDK = Scryme.getSDK;

// Backward compatible type aliases
export type BakeryBatchListResponse = { data: any[] };
export type MemberRole = any;
export type BakeryBranding = any;
export type ProductType = any;
export type Ingredient = any;
// Product, ProductVariant are now exported from @repo/db above
