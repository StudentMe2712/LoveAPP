import { sendTelegramMessage } from "./telegram";

export type SignalType = 'miss_you' | 'want_to_talk' | 'hugs' | 'heavy';

function getSignalLabel(signal: SignalType): string {
    const map: Record<SignalType, string> = {
        'miss_you': 'Скучаю',
        'want_to_talk': 'Хочу поговорить',
        'hugs': 'Хочу обнимашки',
        'heavy': 'Мне тяжело',
    };
    return map[signal] || signal;
}

export async function routeSignalNotification(recipientTelegramChatId: string | null, signal: SignalType, caption?: string) {
    const label = getSignalLabel(signal);
    const msg = caption ? `✨ Ваш партнер отправил сигнал: <b>${label}</b>\n\n<i>${caption}</i>` : `✨ Ваш партнер отправил сигнал: <b>${label}</b>`;

    if (recipientTelegramChatId) {
        await sendTelegramMessage(recipientTelegramChatId, msg, [
            [
                { text: "Мило", callback_data: `reply_${signal}_cute` },
                { text: "Спокойно", callback_data: `reply_${signal}_calm` },
            ],
            [
                { text: "Позвонить", callback_data: `reply_${signal}_call` },
                { text: "План", callback_data: `reply_${signal}_plan` }
            ]
        ]);
    }
}
