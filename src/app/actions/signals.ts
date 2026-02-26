"use server";

import { createClient } from "@/lib/supabase/server";
import { routeSignalNotification, SignalType } from "@/lib/notifications/router";
import { generateComfortingMessage } from "@/lib/ai";
import { checkSignalRateLimit } from "@/lib/redis/rateLimit";
import { revalidatePath } from "next/cache";

export async function sendSignalAction(signalType: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        let userId = user?.id;

        if (!userId) { userId = "00000000-0000-0000-0000-000000000000"; }

        // 1. Anti-spam check
        const rateLimit = await checkSignalRateLimit(userId);
        if (!rateLimit.allowed) {
            return { error: `Подождите ${rateLimit.waitSec} сек. перед следующим сигналом` };
        }

        // 2. Fetch partner ID for notification (from pair table)
        const { data: pairData, error: pairError } = await supabase
            .from("pair")
            .select("user1_id, user2_id")
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .maybeSingle();

        if (pairError) {
            console.error("Pair fetch error", pairError);
            // We don't return an error here so the signal is at least saved to DB
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

        // 4. Send notification to partner
        if (pairData) {
            const partnerId = pairData.user1_id === userId ? pairData.user2_id : pairData.user1_id;

            const signalLabels: Record<string, string> = {
                miss_you: 'Скучаю по тебе ❤️',
                want_to_talk: 'Хочу поговорить 💬',
                hugs: 'Хочу обнимашек 🤗',
                heavy: 'Мне сейчас тяжело 💔',
            };
            const label = signalLabels[signalType] || signalType;

            // Web push to partner's browser (works for Kamilla without Telegram)
            if (partnerId) {
                try {
                    const { sendPushToUser } = await import('@/lib/notifications/webpush');
                    await sendPushToUser(partnerId, {
                        title: 'Наш Домик 🏠',
                        body: label,
                        url: '/',
                        tag: `signal-${signalType}`,
                    });
                } catch (pushErr) {
                    console.error('Web push failed:', pushErr);
                }
            }

            // Telegram to Daulet
            if (partnerId || process.env.TELEGRAM_GROUP_CHAT_ID) {
                const partnerTelegramId = process.env.TELEGRAM_GROUP_CHAT_ID;

                if (partnerTelegramId) {
                    let aiMessage;

                    if (signalType === 'heavy' || signalType === 'miss_you') {
                        const { data: memories } = await supabase
                            .from("memory_items")
                            .select("question, text")
                            .order("created_at", { ascending: false })
                            .limit(5);

                        const contextStr = memories?.map(m => `Q: ${m.question} -> A: ${m.text}`).join("\n") || "";
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
