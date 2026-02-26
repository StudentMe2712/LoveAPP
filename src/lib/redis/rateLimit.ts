import { getRedisClient, isRedisFeatureEnabled } from "@/lib/redis/client";

const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_SEC * 1000;
const KEY_PREFIX = "nd:v1:rl:signal";

const fallbackRateLimitMap = new Map<string, number>();

export type RateLimitCheckResult = {
    allowed: boolean;
    waitSec: number;
    source: "redis" | "fallback";
};

function getFallbackResult(userId: string): RateLimitCheckResult {
    const now = Date.now();
    const lastSignalTime = fallbackRateLimitMap.get(userId);

    if (lastSignalTime && now - lastSignalTime < RATE_LIMIT_WINDOW_MS) {
        const waitSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastSignalTime)) / 1000);
        return { allowed: false, waitSec: Math.max(waitSec, 1), source: "fallback" };
    }

    fallbackRateLimitMap.set(userId, now);
    return { allowed: true, waitSec: 0, source: "fallback" };
}

async function getRedisResult(userId: string): Promise<RateLimitCheckResult | null> {
    if (!isRedisFeatureEnabled("REDIS_RATE_LIMIT_SIGNALS")) return null;

    const redis = getRedisClient();
    if (!redis) {
        console.info("redis=fallback scope=signal_rl reason=client_unavailable");
        return null;
    }

    const key = `${KEY_PREFIX}:${userId}`;

    try {
        const setResult = await redis.set(key, Date.now().toString(), { ex: RATE_LIMIT_WINDOW_SEC, nx: true });

        if (setResult === "OK") {
            console.info(`redis=miss scope=signal_rl key=${key}`);
            return { allowed: true, waitSec: 0, source: "redis" };
        }

        const ttl = await redis.ttl(key);
        const waitSec = typeof ttl === "number" && ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SEC;
        console.info(`redis=hit scope=signal_rl key=${key} ttl=${waitSec}`);
        return { allowed: false, waitSec, source: "redis" };
    } catch (err) {
        console.error("redis=fallback scope=signal_rl reason=error", err);
        return null;
    }
}

export async function checkSignalRateLimit(userId: string): Promise<RateLimitCheckResult> {
    const redisResult = await getRedisResult(userId);
    if (redisResult) return redisResult;

    return getFallbackResult(userId);
}
