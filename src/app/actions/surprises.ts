"use server";

import { createClient } from "@/lib/supabase/server";
import { checkPairAction } from "./auth";
import { revalidatePath } from "next/cache";

export async function getUnrevealedSurpriseAction() {
    try {
        const supabase = await createClient();
        const { userId, pair } = await checkPairAction();
        if (!userId || !pair) return { surprise: null };

        // Find a surprise sent by the PARTNER that is not revealed yet
        const { data, error } = await supabase
            .from('surprises')
            .select('*')
            .eq('pair_id', pair.id)
            .neq('sender_id', userId)
            .eq('is_revealed', false)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error || !data) return { surprise: null };
        return { surprise: data };
    } catch {
        return { surprise: null };
    }
}

export async function revealSurpriseAction(surpriseId: string) {
    try {
        const supabase = await createClient();
        const { userId, pair } = await checkPairAction();
        if (!userId || !pair) return { error: "Unauthenticated" };

        const { error } = await supabase
            .from('surprises')
            .update({ is_revealed: true })
            .eq('id', surpriseId)
            .eq('pair_id', pair.id);

        if (error) return { error: "Ошибка при открытии сюрприза" };

        revalidatePath("/");
        return { success: true };
    } catch {
        return { error: "Внутренняя ошибка сервера" };
    }
}

export async function sendSurpriseAction(contentText: string) {
    try {
        const supabase = await createClient();
        const { userId, pair } = await checkPairAction();
        if (!userId || !pair) return { error: 'Unauthenticated' };

        const { error } = await supabase
            .from('surprises')
            .insert({
                sender_id: userId,
                pair_id: pair.id,
                content_text: contentText,
                is_revealed: false
            });

        if (error) return { error: 'Ошибка при создании сюрприза' };

        revalidatePath('/');
        return { success: true };
    } catch {
        return { error: 'Внутренняя ошибка сервера' };
    }
}

// Store a message that will be visible to the partner only at scheduledAt time
export async function scheduleMessageAction(contentText: string, scheduledAt: string) {
    try {
        const supabase = await createClient();
        const { userId, pair } = await checkPairAction();
        if (!userId || !pair) return { error: 'Unauthenticated' };

        const { error } = await supabase
            .from('surprises')
            .insert({
                sender_id: userId,
                pair_id: pair.id,
                content_text: contentText,
                is_revealed: false,
                scheduled_at: scheduledAt
            });

        if (error) return { error: 'Ошибка при сохранении' };

        return { success: true };
    } catch {
        return { error: 'Внутренняя ошибка' };
    }
}

// Get scheduled messages sent by current user (for viewing what's pending)
export async function getScheduledMessagesAction() {
    try {
        const supabase = await createClient();
        const { userId, pair } = await checkPairAction();
        if (!userId || !pair) return { messages: [] };

        const now = new Date().toISOString();
        const { data } = await supabase
            .from('surprises')
            .select('id, content_text, scheduled_at, created_at')
            .eq('pair_id', pair.id)
            .eq('sender_id', userId)
            .eq('is_revealed', false)
            .gt('scheduled_at', now)
            .order('scheduled_at', { ascending: true });

        return { messages: data || [] };
    } catch {
        return { messages: [] };
    }
}
