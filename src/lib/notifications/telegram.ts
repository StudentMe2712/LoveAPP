// https://core.telegram.org/bots/api
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramInlineKeyboardButton {
    text: string;
    callback_data?: string;
    url?: string;
}

export async function sendTelegramMessage(chatId: string, text: string, inlineKeyboard?: TelegramInlineKeyboardButton[][]) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn("TELEGRAM_BOT_TOKEN is not set, skipping message");
        return;
    }

    const payload: Record<string, unknown> = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
    };

    if (inlineKeyboard && inlineKeyboard.length > 0) {
        payload.reply_markup = {
            inline_keyboard: inlineKeyboard
        };
    }

    const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.text();
        console.error("Failed to send Telegram message", error);
    }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string, url?: string) {
    if (!TELEGRAM_BOT_TOKEN) return;

    const payload: Record<string, unknown> = {
        callback_query_id: callbackQueryId,
    };
    if (text) payload.text = text;
    if (url) payload.url = url;

    await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}
