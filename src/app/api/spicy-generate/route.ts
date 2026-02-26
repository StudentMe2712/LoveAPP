import { NextRequest, NextResponse } from 'next/server';
import { generateSpicyContent, SpicyMode } from '@/lib/ai';
import { rememberJson } from '@/lib/redis/cache';

const SPICY_AI_CACHE_TTL_SEC = 900;

export async function POST(req: NextRequest) {
    try {
        const { mode, count } = await req.json() as { mode: SpicyMode; count?: number };
        if (!mode) return NextResponse.json({ error: 'mode required' }, { status: 400 });

        const normalizedCount = typeof count === "number" && count > 0 ? count : 10;
        const cacheKey = `ai:spicy:${mode}:${normalizedCount}`;

        const items = await rememberJson(
            cacheKey,
            SPICY_AI_CACHE_TTL_SEC,
            async () => generateSpicyContent(mode, normalizedCount),
            "spicy_ai",
        );
        return NextResponse.json({ items });
    } catch (e) {
        console.error('spicy-generate error', e);
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }
}
