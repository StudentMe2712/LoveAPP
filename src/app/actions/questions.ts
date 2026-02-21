"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitAnswerAction(questionId: string, text: string, saveToMemory: boolean) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return { error: "Необходима авторизация" };

        // 1. Insert Answer
        const { error: insertError } = await supabase
            .from('answers')
            .upsert({
                question_id: questionId,
                user_id: user.id,
                text: text
            }, { onConflict: 'question_id, user_id' });

        if (insertError) {
            console.error("Answer insert error", insertError);
            return { error: "Ошибка сохранения ответа" };
        }

        // 2. Conditionally save to Memory Vault
        if (saveToMemory) {
            const { data: qData } = await supabase.from('questions').select('text').eq('id', questionId).single();
            if (qData) {
                await supabase.from('memory_items').insert({
                    user_id: user.id,
                    topic: `Ответ: ${qData.text.substring(0, 30)}...`,
                    content: text
                });
            }
        }

        revalidatePath("/questions");
        return { success: true };

    } catch (err) {
        console.error("submitAnswerAction exception", err);
        return { error: "Внутренняя ошибка сервера" };
    }
}
