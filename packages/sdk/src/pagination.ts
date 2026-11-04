/**
 * Enterprise Auto-Pagination Async Iterator
 */

export interface PageResult<T> {
  data: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    [key: string]: any;
  };
}

export type PageFetcher<T> = (params: { page: number; limit?: number }) => Promise<PageResult<T>>;

export interface AutoPagingOptions {
  limit?: number;
  maxItems?: number;
}

/**
 * Creates an AsyncIterableIterator over paginated items.
 * Usage:
 * ```ts
 * for await (const item of autoPaging(async ({ page, limit }) => client.products.list({ page, limit }))) {
 *   console.log(item.name);
 * }
 * ```
 */
export async function* autoPaging<T>(
  fetcher: PageFetcher<T>,
  options: AutoPagingOptions = {}
): AsyncIterableIterator<T> {
  const limit = options.limit ?? 50;
  const maxItems = options.maxItems ?? Infinity;
  let page = 1;
  let yieldedCount = 0;

  while (yieldedCount < maxItems) {
    const pageResult = await fetcher({ page, limit });
    const items = pageResult.data || [];

    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      yield item;
      yieldedCount++;
      if (yieldedCount >= maxItems) {
        return;
      }
    }

    const meta = pageResult.meta;
    if (meta) {
      if (typeof meta.hasNextPage === "boolean" && !meta.hasNextPage) {
        break;
      }
      if (typeof meta.totalPages === "number" && page >= meta.totalPages) {
        break;
      }
      if (typeof meta.total === "number" && page * limit >= meta.total) {
        break;
      }
    }

    if (items.length < limit) {
      break;
    }

    page++;
  }
}

/**
 * Collects all items from an auto-paging fetcher into an array.
 */
export async function autoPagingToArray<T>(
  fetcher: PageFetcher<T>,
  options: AutoPagingOptions = {}
): Promise<T[]> {
  const results: T[] = [];
  for await (const item of autoPaging(fetcher, options)) {
    results.push(item);
  }
  return results;
}
