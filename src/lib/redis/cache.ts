import { getRedisClient, isRedisFeatureEnabled } from "@/lib/redis/client";

type CacheScope = "quiz_ai" | "spicy_ai";

const CACHE_PREFIX = "nd:v1";

function buildCacheKey(key: string): string {
    return key.startsWith(`${CACHE_PREFIX}:`) ? key : `${CACHE_PREFIX}:${key}`;
}

export async function readJsonCache<T>(key: string, scope: CacheScope): Promise<T | null> {
    if (!isRedisFeatureEnabled("REDIS_CACHE_AI")) return null;

    const redis = getRedisClient();
    if (!redis) return null;

    const cacheKey = buildCacheKey(key);

    try {
        const raw = await redis.get<string | T>(cacheKey);
        if (raw === null || raw === undefined) return null;

        if (typeof raw === "string") {
            return JSON.parse(raw) as T;
        }

        return raw as T;
    } catch (err) {
        console.error(`redis=fallback scope=${scope} reason=read_error key=${cacheKey}`, err);
        return null;
    }
}

export async function writeJsonCache<T>(key: string, value: T, ttlSec: number, scope: CacheScope): Promise<void> {
    if (!isRedisFeatureEnabled("REDIS_CACHE_AI")) return;

    const redis = getRedisClient();
    if (!redis) return;

    const cacheKey = buildCacheKey(key);

    try {
        await redis.set(cacheKey, JSON.stringify(value), { ex: ttlSec });
    } catch (err) {
        console.error(`redis=fallback scope=${scope} reason=write_error key=${cacheKey}`, err);
    }
}

export async function rememberJson<T>(
    key: string,
    ttlSec: number,
    producer: () => Promise<T>,
    scope: CacheScope,
): Promise<T> {
    if (!isRedisFeatureEnabled("REDIS_CACHE_AI")) {
        console.info(`redis=fallback scope=${scope} reason=disabled`);
        return producer();
    }

    const cacheKey = buildCacheKey(key);
    const cached = await readJsonCache<T>(key, scope);
    if (cached !== null) {
        console.info(`redis=hit scope=${scope} key=${cacheKey}`);
        return cached;
    }

    console.info(`redis=miss scope=${scope} key=${cacheKey}`);
    const fresh = await producer();
    await writeJsonCache(cacheKey, fresh, ttlSec, scope);
    return fresh;
}
