import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { checkPairAction } from '@/app/actions/auth';

// Configure VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:' + (process.env.VAPID_EMAIL || 'hello@nashdomik.app'),
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

async function sendNotification(subscription: PushSubscriptionJSON, payload: object) {
    try {
        await webpush.sendNotification(
            subscription as webpush.PushSubscription,
            JSON.stringify(payload)
        );
        return true;
    } catch {
        return false;
    }
}

// GET /api/notifications/smart?secret=xxx&type=morning|inactive
export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get('type') || 'morning';
    const supabase = await createClient();

    // Get all push subscriptions
    const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('user_id, subscription');

    if (!subs || subs.length === 0) {
        return NextResponse.json({ sent: 0 });
    }

    let sent = 0;

    if (type === 'morning') {
        // Send "Good morning" to all subscribers
        for (const sub of subs) {
            const ok = await sendNotification(sub.subscription, {
                title: 'Наш Домик 🏠',
                body: '☀️ Доброе утро, любимый! Как настроение сегодня?',
                data: { url: '/' },
                tag: 'morning-greeting',
            });
            if (ok) sent++;
        }
    } else if (type === 'inactive') {
        // Check last activity per user — send nudge if > 12 hours since last page visit
        // We use the pair's last moment/message timestamp as proxy
        for (const sub of subs) {
            const userId = sub.user_id;

            // Check last signal/moment
            const { data: lastActivity } = await supabase
                .from('moments')
                .select('created_at')
                .eq('uploader_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const lastTs = lastActivity?.created_at
                ? new Date(lastActivity.created_at).getTime()
                : 0;
            const hoursSince = (Date.now() - lastTs) / 1000 / 3600;

            if (hoursSince > 12) {
                const ok = await sendNotification(sub.subscription, {
                    title: 'Наш Домик 🏠',
                    body: '💌 Давно не заходил! Напиши что-нибудь партнёру 💕',
                    data: { url: '/' },
                    tag: 'inactivity-nudge',
                });
                if (ok) sent++;
            }
        }
    }

    return NextResponse.json({ sent, type });
}
