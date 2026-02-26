import { Redis } from "@upstash/redis";

type RedisFeatureFlag = "REDIS_RATE_LIMIT_SIGNALS" | "REDIS_CACHE_AI";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

let redisSingleton: Redis | null | undefined;

function isTruthy(value: string | undefined, defaultValue = false): boolean {
    if (typeof value !== "string") return defaultValue;
    return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function isRedisEnabled(): boolean {
    if (!isTruthy(process.env.REDIS_ENABLED, false)) return false;
    return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function isRedisFeatureEnabled(feature: RedisFeatureFlag): boolean {
    if (!isRedisEnabled()) return false;
    return isTruthy(process.env[feature], true);
}

export function getRedisClient(): Redis | null {
    if (!isRedisEnabled()) return null;
    if (redisSingleton !== undefined) return redisSingleton;

    try {
        redisSingleton = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
    } catch (err) {
        console.error("redis=fallback scope=redis_client reason=init_failed", err);
        redisSingleton = null;
    }

    return redisSingleton;
}
