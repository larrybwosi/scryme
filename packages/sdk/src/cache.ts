/**
 * Zero-dependency In-Memory Cache with TTL and LRU Eviction
 */

export interface CacheOptions {
  enabled?: boolean;
  ttlMs?: number;
  maxEntries?: number;
}

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  public enabled: boolean;
  public ttlMs: number;
  public maxEntries: number;
  private store: Map<string, CacheEntry> = new Map();

  constructor(options: CacheOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.ttlMs = options.ttlMs ?? 60000; // 1 minute default
    this.maxEntries = options.maxEntries ?? 200;
  }

  public get<T = any>(key: string): T | undefined {
    if (!this.enabled) return undefined;
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Refresh LRU order by re-inserting
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  public set<T = any>(key: string, value: T, customTtlMs?: number): void {
    if (!this.enabled) return;

    const ttl = customTtlMs ?? this.ttlMs;
    if (ttl <= 0) return;

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict oldest (first inserted in Map)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}
