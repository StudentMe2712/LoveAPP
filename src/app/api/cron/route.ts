import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/notifications/telegram';

// This endpoint should be hit by a Windows Task Scheduler or external CRON service
// e.g. GET https://your-tunnel-url.trycloudflare.com/api/cron?secret=YOUR_CRON_SECRET

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple security check
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Use service role key to bypass RLS for cron job
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // IMPORTANT: ensure this exists in .env.local
        const supabase = createClient(supabaseUrl, supabaseKey);

        const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
        if (!chatId) {
            return NextResponse.json({ error: 'No telegram chat id configured' }, { status: 500 });
        }

        let messagesSent = 0;

        // 1. Check for unacknowledged signals older than 2 hours to remind Daulet
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const twoAndHalfHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString();

        const { data: oldSignals } = await supabase
            .from('signals')
            .select('*')
            .eq('acknowledged', false)
            .lte('created_at', twoHoursAgo)
            .gte('created_at', twoAndHalfHoursAgo);

        if (oldSignals && oldSignals.length > 0) {
            await sendTelegramMessage(
                chatId,
                `🧸 <b>Напоминание!</b>\n\nУ вас есть непрочитанные сигналы от партнера. Загляните в Домик, чтобы ответить взаимностью!`
            );
            messagesSent++;
        }

        // 2. Remind about locked plans
        // We trigger a plan reminder if there are any locked plans, maybe just a daily summary.
        // To prevent spam, we only send this plan summary if it's around a specific hour? 
        // For simplicity in the MVP, we assume the CRON runs every 30 mins, we check if it's between 19:00 and 19:30 UTC
        const now = new Date();
        const isEvening = now.getUTCHours() === 19 && now.getUTCMinutes() <= 30;

        if (isEvening) {
            const { data: lockedPlans } = await supabase
                .from('plans')
                .select('*')
                .eq('status', 'locked')
                .order('created_at', { ascending: false });

            if (lockedPlans && lockedPlans.length > 0) {
                let msg = `📆 <b>Вечерняя сводка планов:</b>\n\n`;
                lockedPlans.forEach(p => {
                    msg += `• <b>${p.title}</b> (Время: ${p.chosen_slot || 'не указано'})\n`;
                });
                msg += `\nКруто, что вы проводите время вместе! ✨`;

                await sendTelegramMessage(chatId, msg);
                messagesSent++;
            }
        }

        return NextResponse.json({ success: true, messagesSent });

    } catch (err: any) {
        console.error('CRON Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
