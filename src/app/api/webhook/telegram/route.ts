import { NextResponse } from 'next/server';
import { sendTelegramMessage, answerCallbackQuery } from '@/lib/notifications/telegram';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (body.callback_query) {
            const query = body.callback_query;
            const data = query.data;
            const chatId = query.message?.chat?.id;

            await answerCallbackQuery(query.id);

            if (chatId && data && data.startsWith('reply_')) {
                // data format: reply_{signal}_{mood}
                // signal might have underscores, so let's parse safely
                const parts = data.split('_');
                // parts[0] === 'reply'
                // e.g. reply_hugs_cute -> signal 'hugs', mood 'cute'
                // e.g. reply_want_to_talk_call -> signal 'want_to_talk', mood 'call'

                let signal = parts[1];
                const mood = parts.length > 2 ? parts[parts.length - 1] : '';

                if (parts.length > 3) {
                    // Re-join the middle parts for the signal if it contains an underscore
                    signal = parts.slice(1, -1).join('_');
                }

                const { getRandomReplyAction } = await import('@/app/actions/replies');
                const suggestion = await getRandomReplyAction(signal, mood);

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nash-domik.example.com";

                await sendTelegramMessage(chatId, `Готовый ответ:\n<i>${suggestion.text}</i>`, [
                    [{ text: "Открыть приложение", url: `${appUrl}/support` }]
                ]);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Telegram Webhook Error", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
