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

type QuizSuggestion = { question: string; hint?: string };

function pickText(value: unknown): string | null {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const textValue = record.text;
        if (typeof textValue === "string" && textValue.trim().length > 0) {
            return textValue.trim();
        }
        for (const candidate of Object.values(record)) {
            if (typeof candidate === "string" && candidate.trim().length > 0) {
                return candidate.trim();
            }
        }
    }
    return null;
}

function normalizeQuizSuggestion(item: unknown): QuizSuggestion | null {
    if (typeof item === "string") {
        const question = item.trim();
        return question ? { question } : null;
    }
    if (!item || typeof item !== "object") return null;

    const record = item as Record<string, unknown>;
    const values = Object.values(record);
    const question =
        pickText(record.question) ??
        pickText(record.prompt) ??
        pickText(record.text) ??
        pickText(record.title) ??
        pickText(record.q) ??
        pickText(record.ask) ??
        pickText(values[0]);

    if (!question) return null;

    const hint =
        pickText(record.hint) ??
        pickText(record.clue) ??
        pickText(record.tip) ??
        pickText(record.help) ??
        pickText(values[1]);

    return hint && hint !== question ? { question, hint } : { question };
}
/**
 * Generate quiz questions for the "How well do you know me?" game.
 * Returns 5 creative, personal questions the user can answer about themselves.
 */
export async function generateQuizQuestions(): Promise<{ question: string; hint?: string }[]> {
    const fallback = [
        { question: 'Какое моё любимое блюдо?', hint: 'Подумай про ужин' },
        { question: 'Какое моё тайное умение?', hint: 'То, о чём я редко говорю' },
        { question: 'Какого цвета я ассоциирую себя?', hint: 'Настроение и характер' },
        { question: 'Какой мой любимый способ отдыха?', hint: 'После долгого дня' },
        { question: 'Чего я боюсь?', hint: 'Честно 😅' },
    ];

    if (!process.env.GROQ_API_KEY) return fallback;

    try {
        const prompt = `Ты помогаешь паре лучше узнать друг друга в игре "Как ты меня знаешь?".
Придумай 5 оригинальных, личных и немного игривых вопросов, которые человек может ответить о себе, а партнёр потом угадывает ответ.
Вопросы должны быть:
- Личными и конкретными (не общими)
- Немного неожиданными и интересными
- На русском языке
- С коротким подсказкой-намёком (hint) до 5 слов

ВАЖНО: Выведи ТОЛЬКО валидный JSON массив. Никакого дополнительного текста.
Формат:
[
  { "question": "...", "hint": "..." },
  ...
]`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL_NAME,
            temperature: 0.9,
            max_tokens: 400,
            response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content || '{}';
        // Groq returns a json_object root — handle both array wrapper and direct array
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.items || Object.values(parsed)[0]);
        if (Array.isArray(arr) && arr.length > 0) {
            const normalized = arr
                .map(normalizeQuizSuggestion)
                .filter((item): item is QuizSuggestion => item !== null)
                .slice(0, 5);
            if (normalized.length > 0) return normalized;
        }
        return fallback;
    } catch (e) {
        console.error('generateQuizQuestions error:', e);
        return fallback;
    }
}

export type SpicyMode = 'truth' | 'dare' | 'rather' | 'discuss' | 'hot' | 'hot-dare';

/**
 * Generate fresh questions/challenges/dilemmas for the /spicy page.
 * mode: truth | dare | rather | discuss | hot | hot-dare
 * count: how many items to generate (default 10)
 */
export async function generateSpicyContent(mode: SpicyMode, count = 10): Promise<string[] | [string, string][]> {
    const fallback: string[] = ["Что ты любишь во мне больше всего — прямо сейчас?"];

    if (!process.env.GROQ_API_KEY) return fallback;

    const prompts: Record<SpicyMode, string> = {
        truth: `Ты помощник для романтической игры пары. Придумай ${count} глубоких и личных вопросов типа "Правда" для влюблённой пары на русском языке. Вопросы должны быть искренними, немного уязвимыми, о чувствах, мечтах и воспоминаниях. Выведи ТОЛЬКО JSON массив строк.`,
        dare: `Ты помощник для романтической игры пары. Придумай ${count} весёлых и креативных заданий типа "Действие" для пары на русском языке. Задания должны быть выполнимы в комнате, не требовать реквизита, и укреплять близость. Выведи ТОЛЬКО JSON массив строк.`,
        rather: `Ты помощник для романтической игры пары. Придумай ${count} дилемм типа "Что лучше?" для пары на русском языке. Каждая дилемма — это выбор между двумя сложными, но интересными вариантами. Выведи ТОЛЬКО JSON массив из массивов-пар: [["вариант А", "вариант Б"], ...].`,
        discuss: `Ты помощник для романтической игры пары. Придумай ${count} глубоких тем для разговора вдвоём на русском языке — о будущем, ценностях, мечтах, воспоминаниях, жизни. Формулируй как вопросы или темы. Выведи ТОЛЬКО JSON массив строк.`,
        hot: `Ты помощник для интимной романтической игры пары (только для взрослых). Придумай ${count} чувственных и интимных вопросов для влюблённой пары на русском языке — о влечении, прикосновениях, желаниях, физической близости. Без пошлости, но откровенно. Выведи ТОЛЬКО JSON массив строк.`,
        'hot-dare': `Ты помощник для интимной романтической игры пары (только для взрослых). Придумай ${count} чувственных заданий для влюблённой пары на русском языке — поцелуи, прикосновения, массаж, признания. Без пошлости, но чувственно. Выведи ТОЛЬКО JSON массив строк.`,
    };

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompts[mode] }],
            model: MODEL_NAME,
            temperature: 1.0,
            max_tokens: 800,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || '[]';
        // Extract JSON array from possible markdown code block
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return fallback;
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        return fallback;
    } catch (e) {
        console.error('generateSpicyContent error:', e);
        return fallback;
    }
}
