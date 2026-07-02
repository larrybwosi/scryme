import { Redis } from "ioredis";
export declare function getIOClient(): Redis;
export declare function getFromCache<T>(key: string): Promise<T | null>;
export declare function setToCache(key: string, value: any, ttlSeconds?: number): Promise<void>;
export declare function invalidateCache(keyOrPattern: string): Promise<void>;
