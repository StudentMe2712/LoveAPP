"use server";

import { createClient } from "@/lib/supabase/server";
import { generateHomeInsight } from "@/lib/ai";

export async function fetchAIInsightAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            const insight = await generateHomeInsight("Recent Context:\n(User not authenticated, using default prompt)");
            return { data: insight };
        }
        // Gather context
        // 1. Recent signals
        const { data: signals } = await supabase
            .from("signals")
            .select("type, created_at, sender_id")
            .order("created_at", { ascending: false })
            .limit(5);

        // 2. Recent memory vault items
        const { data: memories } = await supabase
            .from("memory_items")
            .select("question, text")
            .order("created_at", { ascending: false })
            .limit(3);

        let contextBuilder = "Recent Context:\n";

        if (signals && signals.length > 0) {
            contextBuilder += "Signals: " + signals.map(s => `${s.type === 'miss_you' ? 'Скучаю' : s.type === 'heavy' ? 'Мне тяжело' : s.type} (${new Date(s.created_at).toLocaleDateString()})`).join(", ") + "\n";
        }

        if (memories && memories.length > 0) {
            contextBuilder += "Memories/Answers: " + memories.map(m => `Q: ${m.question} -> A: ${m.text}`).join(" | ") + "\n";
        }

        const insight = await generateHomeInsight(contextBuilder);

        return { data: insight };
    } catch (err) {
        console.error("fetchAIInsightAction exception", err);
        return { error: "Ошибка генерации инсайта" };
    }
}

export async function confirmAIProposalAction(type: string, payload: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let userId = user?.id;
        if (!userId) {
            return { error: 'Не авторизован' };
        }

        const { data: pairData, error: pairError } = await supabase
            .from("pair")
            .select("user1_id, user2_id")
            .limit(1)
            .single();

        let partnerTelegramId = process.env.TELEGRAM_GROUP_CHAT_ID;

        if (!partnerTelegramId && pairData) {
            // We might map partnerId to a telegram ID in the future
            // const partnerId = pairData.user1_id === userId ? pairData.user2_id : pairData.user1_id;
        }

        if (partnerTelegramId) {
            const { sendTelegramMessage } = await import("@/lib/notifications/telegram");

            if (type === 'message') {
                await sendTelegramMessage(partnerTelegramId, `✨ Сюрприз от партнера:\n\n<i>${payload}</i>`);
            } else if (type === 'plan') {
                await sendTelegramMessage(partnerTelegramId, `📅 Ваш партнер предлагает новый план!\n\n<b>Идея:</b> <i>${payload}</i>`, [
                    [
                        { text: "Согласиться", callback_data: `reply_plan_accept` },
                        { text: "Позже", callback_data: `reply_plan_later` },
                    ]
                ]);
            }
        }

        return { success: true };
    } catch (err) {
        console.error("confirmAIProposalAction exception", err);
        return { error: "Ошибка подтверждения" };
    }
}
