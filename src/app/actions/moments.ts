"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createMomentAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return { error: "Необходима авторизация" };

        const photo = formData.get('photo') as File | null;
        const caption = formData.get('caption') as string | null;

        if (!photo) return { error: "Фото обязательно" };

        // 1. Upload to Supabase Storage
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('moments')
            .upload(filePath, photo);

        if (uploadError) {
            console.error("Storage upload error", uploadError);
            return { error: "Ошибка загрузки файла" };
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('moments')
            .getPublicUrl(filePath);

        // 2. Insert DB record
        const { error: insertError } = await supabase
            .from('moments')
            .insert({
                sender_id: user.id,
                photo_url: publicUrlData.publicUrl,
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
