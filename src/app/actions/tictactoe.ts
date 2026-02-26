"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTicTacToeScoreAction(pairId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Необходима авторизация" };

    const { data, error } = await supabase
        .from('tictactoe_scores')
        .select('*')
        .eq('pair_id', pairId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching score:", error);
        return { error: "Ошибка при получении счета" };
    }

    if (!data) {
        // Find who is user1 in pair to initialize
        const { data: pairData } = await supabase.from('pair').select('user1_id, user2_id').eq('id', pairId).single();
        if (pairData) {
            const { data: newData, error: insertError } = await supabase
                .from('tictactoe_scores')
                .insert({
                    pair_id: pairId,
                    user1_id: pairData.user1_id,
                    user2_id: pairData.user2_id,
                    user1_score: 0,
                    user2_score: 0
                })
                .select()
                .single();
            if (!insertError && newData) {
                return { success: true, scores: newData };
            }
        }
    }

    return { success: true, scores: data };
}

export async function incrementTicTacToeScoreAction(pairId: string, winnerId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Необходима авторизация" };

    // Fetch current
    const { data: current, error: fetchErr } = await supabase
        .from('tictactoe_scores')
        .select('*')
        .eq('pair_id', pairId)
        .single();

    if (fetchErr || !current) return { error: "Не найден счет" };

    let updateData = {};
    if (current.user1_id === winnerId) {
        updateData = { user1_score: current.user1_score + 1 };
    } else if (current.user2_id === winnerId) {
        updateData = { user2_score: current.user2_score + 1 };
    } else {
        return { error: "Победитель не состоит в паре" };
    }

    const { data, error } = await supabase
        .from('tictactoe_scores')
        .update(updateData)
        .eq('pair_id', pairId)
        .select()
        .single();

    if (error) return { error: "Ошибка при обновлении счета" };

    return { success: true, scores: data };
}
