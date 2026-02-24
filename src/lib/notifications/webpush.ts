import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_MAILTO = process.env.VAPID_MAILTO || 'mailto:admin@nashdomik.app';

function initWebPush() {
    if (VAPID_PUBLIC && VAPID_PRIVATE) {
        webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE);
    }
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<boolean> {
    initWebPush();

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
        console.warn('VAPID keys not configured, skipping web push');
        return false;
    }

    try {
        const supabase = await createClient();
        const { data: sub } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', userId)
            .single();

        if (!sub) return false;

        const subscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        await webpush.sendNotification(subscription, JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: payload.badge || '/icons/icon-72x72.png',
            tag: payload.tag || 'nashdomik',
            data: { url: payload.url || '/' },
        }));

        return true;
    } catch (err: any) {
        if (err?.statusCode === 410) {
            // Subscription expired - remove it
            const supabase = await createClient();
            await supabase.from('push_subscriptions').delete().eq('user_id', userId);
        }
        console.error('sendPushToUser error:', err?.statusCode, err?.message);
        return false;
    }
}
