interface RedisClient {
    get: <T>(key: string) => Promise<T | null>;
    setex: <T>(key: string, ttl: number, value: T) => Promise<void>;
    del: (...keys: string[]) => Promise<number>;
    keys: (pattern: string) => Promise<string[]>;
    incr: (key: string) => Promise<number>;
    expire: (key: string, ttl: number) => Promise<number>;
    ttl: (key: string) => Promise<number>;
}
export declare const getRedisClient: () => Promise<RedisClient>;
export declare const redisProxy: RedisClient;
export {};
