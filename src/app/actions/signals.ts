"use server";

import { createClient } from "@/lib/supabase/server";
import { routeSignalNotification, SignalType } from "@/lib/notifications/router";
import { generateComfortingMessage } from "@/lib/ai";
import { revalidatePath } from "next/cache";

// Simple in-memory rate limiting map for the MVP
// Key: user_id, Value: timestamp of last signal
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute

export async function sendSignalAction(signalType: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        let userId = user?.id;

        if (!userId) {
            return { error: 'Не авторизован' };
        }

        // 1. Anti-spam check
        const lastSignalTime = rateLimitMap.get(userId);
        const now = Date.now();
        if (lastSignalTime && (now - lastSignalTime) < RATE_LIMIT_MS) {
            const minutesLeft = Math.ceil((RATE_LIMIT_MS - (now - lastSignalTime)) / 1000);
            return { error: `Подождите ${minutesLeft} сек. перед следующим сигналом` };
        }

        // 2. Fetch partner ID for notification (from pair table)
        const { data: pairData, error: pairError } = await supabase
            .from("pair")
            .select("user1_id, user2_id")
            .limit(1)
            .single();

        if (pairError && pairError.code !== 'PGRST116') {
            console.error("Pair fetch error", pairError);
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy')) {
                return { error: "Ошибка при получении данных пары" };
            }
        }

        // 3. Save signal to DB (Supabase)
        const { error: insertError } = await supabase
            .from("signals")
            .insert({
                sender_id: userId,
                type: signalType
            });

        if (insertError) {
            console.error("Insert error", insertError);
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy')) {
                return { error: "Не удалось сохранить сигнал" };
            }
        }

        rateLimitMap.set(userId, now);

        // 4. Send notification to partner
        if (pairData) {
            const partnerId = pairData.user1_id === userId ? pairData.user2_id : pairData.user1_id;

            if (partnerId || process.env.TELEGRAM_GROUP_CHAT_ID) {
                const partnerTelegramId = process.env.TELEGRAM_GROUP_CHAT_ID;

                if (partnerTelegramId) {
                    let aiMessage;

                    if (signalType === 'heavy' || signalType === 'miss_you') {
                        // Gather context
                        const { data: memories } = await supabase
                            .from("memory_items")
                            .select("question, text")
                            .order("created_at", { ascending: false })
                            .limit(5);

                        let contextStr = memories?.map(m => `Q: ${m.question} -> A: ${m.text}`).join("\n") || "";
                        aiMessage = await generateComfortingMessage(contextStr);
                    }

                    await routeSignalNotification(partnerTelegramId, signalType as SignalType, aiMessage);
                }
            }
        }

        revalidatePath("/");
        return { success: true };

    } catch (err) {
        console.error("sendSignalAction error", err);
        return { error: "Внутренняя ошибка сервера" };
    }
}
