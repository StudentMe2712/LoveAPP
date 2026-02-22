"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = "\\\\itskom\\Y\\Даулет\\images";

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
