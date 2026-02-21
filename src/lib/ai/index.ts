import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy_key',
});

// We can use a fast model like llama-3.1-8b-instant or a more capable one like llama-3.3-70b-versatile
const MODEL_NAME = 'llama-3.1-8b-instant';

/**
 * Generate a personalized comforting message based on recent context.
 */
export async function generateComfortingMessage(context: string): Promise<string> {
    if (!process.env.GROQ_API_KEY) {
        return "Всё обязательно наладится! Я всегда рядом с тобой ❤️";
    }

    try {
        const prompt = `Ты любящий партнер в отношениях. Твоя девушка (Аня) сейчас переживает не лучшие времена или ей тяжело.
Контекст ваших отношений и недавних событий:
${context}

Напиши одно короткое, очень теплое и поддерживающее сообщение (1-2 предложения), которое я могу ей отправить, чтобы её успокоить и показать мою любовь. Не используй хештеги, приветствия или подписи. Просто сам текст сообщения на русском языке. Максимально естественно и искренне.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL_NAME,
            temperature: 0.7,
            max_tokens: 150,
        });

        return chatCompletion.choices[0]?.message?.content?.trim() || "Я с тобой ❤️";
    } catch (e) {
        console.error("Groq AI Generation error:", e);
        return "Люблю тебя и всегда рядом! ❤️";
    }
}

export type AIInsightResponse = {
    text: string;
    action?: string;
    actionLabel?: string;
    proposalType?: 'message' | 'plan';
    proposalPayload?: string;
};

/**
 * Analyze recent data and generate a dynamic insight to show on the dashboard.
 */
export async function generateHomeInsight(context: string): Promise<AIInsightResponse> {
    if (!process.env.GROQ_API_KEY) {
        return {
            text: "Давай проведем тихий вечер вдвоем? 🍷",
        };
    }

    try {
        const prompt = `Ты ИИ-помощник (Купидон) встроенный в семейное приложение для пары ("Наш домик").
Пользователь (парень) смотрит на главный экран.
Вот последние данные из базы (сигналы, ответы на вопросы, планы, моменты):
${context}

Основываясь на этих данных, придумай ОДНУ интересную, короткую (до 15 слов) идею, инсайт или совет для него на русском языке.
Например: Если девушка часто пишет 'Скучаю', предложи позвать её на свидание. Если она недавно писала, что устала, предложи сделать массаж. Если есть сохраненный ответ на вопрос про еду, упомяни это.
ты также можешь предложить КОНКРЕТНОЕ ДЕЙСТВИЕ (proposal), которое пользователь может подтвердить одной кнопкой.
Например: отправить ей милое сообщение, или предложить конкретный план на вечер (кино, ужин).

ВАЖНО: Выведи ТОЛЬКО валидный JSON объект. Никакого дополнительного текста до или после JSON.
Формат JSON:
{
  "text": "сам инсайт (строка, с эмодзи)",
  "action": "URL relative path к странице (например, /plans, /questions, или null если действие не требуется)",
  "actionLabel": "Текст кнопки (например Создать план, или null)",
  "proposalType": "тип конкретного предложения: 'message', 'plan', или null если нет предложения",
  "proposalPayload": "текст сообщения для отправки, или название плана, или null"
}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL_NAME,
            temperature: 0.8,
            max_tokens: 200,
            response_format: { type: "json_object" }
        });

        const jsonStr = chatCompletion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(jsonStr);

        // Convert null strings/actual nulls to undefined to satisfy TypeScript strict mode
        return {
            text: parsed.text || "Как насчет небольшого сюрприза для нее? ✨",
            action: parsed.action === "null" || parsed.action === null ? undefined : parsed.action,
            actionLabel: parsed.actionLabel === "null" || parsed.actionLabel === null ? undefined : parsed.actionLabel,
            proposalType: parsed.proposalType === "null" || parsed.proposalType === null ? undefined : parsed.proposalType,
            proposalPayload: parsed.proposalPayload === "null" || parsed.proposalPayload === null ? undefined : parsed.proposalPayload
        };
    } catch (e) {
        console.error("Groq AI Insight error:", e);
        return {
            text: "Как насчет небольшого сюрприза для нее? ✨",
        };
    }
}
