"use server";

import { createClient } from "@/lib/supabase/server";

export async function getRandomReplyAction(signalType: string, mood?: string) {
    try {
        const supabase = await createClient();

        // mood is roughly appended to signal, e.g. miss_you_cute
        const typeQuery = mood ? `${signalType}_${mood}` : signalType;

        // We fetch all matching from DB, then pick random. 
        // Usually we would do ORDER BY random() LIMIT 1 in RPC, but parsing in JS is fine for small sets
        const { data, error } = await supabase
            .from('replies')
            .select('text')
            .like('type', `${typeQuery}%`); // allow grabbing 'miss_you_cute' or 'miss_you_calm' if mood is missing

        if (error || !data || data.length === 0) {
            // Fallbacks
            return { text: "❤️ Я с тобой!" };
        }

        const randomRow = data[Math.floor(Math.random() * data.length)];
        return { text: randomRow.text };

    } catch (err) {
        console.error("getRandomReplyAction error", err);
        return { text: "❤️ Обнимаю!" };
    }
}
