import { NextRequest, NextResponse } from 'next/server';
import { generateSpicyContent, SpicyMode } from '@/lib/ai';

export async function POST(req: NextRequest) {
    try {
        const { mode, count } = await req.json() as { mode: SpicyMode; count?: number };
        if (!mode) return NextResponse.json({ error: 'mode required' }, { status: 400 });

        const items = await generateSpicyContent(mode, count || 10);
        return NextResponse.json({ items });
    } catch (e) {
        console.error('spicy-generate error', e);
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }
}
