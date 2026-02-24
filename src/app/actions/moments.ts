"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = "\\\\itskom\\Y\\Даулет\\images";

type TimeMachineMoment = {
    id: string;
    sender_id: string;
    photo_url: string;
    caption: string | null;
    created_at: string;
};

function interleaveBySender(moments: TimeMachineMoment[]): TimeMachineMoment[] {
    const buckets = new Map<string, TimeMachineMoment[]>();
    for (const moment of moments) {
        const senderBucket = buckets.get(moment.sender_id);
        if (senderBucket) {
            senderBucket.push(moment);
            continue;
        }
        buckets.set(moment.sender_id, [moment]);
    }

    if (buckets.size <= 1) return moments;

    const queues = Array.from(buckets.values()).map((list) => [...list]);
    const interleaved: TimeMachineMoment[] = [];

    let hasItems = true;
    while (hasItems) {
        hasItems = false;
        for (const queue of queues) {
            const nextItem = queue.shift();
            if (nextItem) {
                interleaved.push(nextItem);
                hasItems = true;
            }
        }
    }

    return interleaved;
}

function rotateByDailySeed<T>(items: T[]): T[] {
    if (items.length <= 1) return items;

    const seed = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (const char of seed) {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }

    const offset = hash % items.length;
    return [...items.slice(offset), ...items.slice(0, offset)];
}

export async function createMomentAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        let userId = user?.id || "00000000-0000-0000-0000-000000000000";

        const photo = formData.get('photo') as File | null;
        const caption = formData.get('caption') as string | null;

        if (!photo) return { error: "Фото обязательно" };

        const fileExt = photo.name.split('.').pop() || 'jpg';
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = path.join(UPLOADS_DIR, fileName);

        let publicUrl = "";

        try {
            // Attempt to create dir just in case, though it's a network share
            await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => { });

            const arrayBuffer = await photo.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            await fs.writeFile(filePath, buffer);

            publicUrl = `/api/images/${fileName}`;
        } catch (e) {
            console.error("Local file write error", e);
            return { error: "Ошибка сохранения файла на сервере" };
        }

        // 2. Insert DB record
        const { error: insertError } = await supabase
            .from('moments')
            .insert({
                sender_id: userId,
                photo_url: publicUrl,
                caption: caption || null
            });

        if (insertError) {
            console.error("DB insert error", insertError);
            return { error: "Ошибка сохранения момента" };
        }

        revalidatePath("/");
        return { success: true };

    } catch (err) {
        console.error("createMomentAction exception", err);
        return { error: "Внутренняя ошибка сервера" };
    }
}

export async function getTimeMachineMomentAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { moment: null, moments: [] as TimeMachineMoment[] };

        // For testing/quick results, let's just use 1 day ago. In a real app we'd use 30+ days.
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        const { data, error } = await supabase
            .from('moments')
            .select('id, sender_id, photo_url, caption, created_at')
            .lt('created_at', pastDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(200);

        if (error || !data || data.length === 0) {
            return { moment: null, moments: [] as TimeMachineMoment[] };
        }

        const interleaved = interleaveBySender(data as TimeMachineMoment[]);
        const ordered = rotateByDailySeed(interleaved);
        const moments = ordered.slice(0, 24);

        return {
            moment: moments[0] ?? null,
            moments,
        };
    } catch {
        return { moment: null, moments: [] as TimeMachineMoment[] };
    }
}

export async function toggleLikeMomentAction(id: string, liked: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Необходима авторизация" };
    const { error } = await supabase.from('moments').update({ is_liked: liked }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath("/gallery");
    return { success: true };
}

export async function toggleFavoriteMomentAction(id: string, favorited: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Необходима авторизация" };
    const { error } = await supabase.from('moments').update({ is_favorited: favorited }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath("/gallery");
    return { success: true };
}

export async function updateMomentCaptionAction(id: string, caption: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Необходима авторизация" };
    const { error } = await supabase.from('moments').update({ caption: caption.trim() || null }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath("/gallery");
    return { success: true };
}
