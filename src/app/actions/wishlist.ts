"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = "\\\\itskom\\Y\\Даулет\\images";

export async function addWishlistItemAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return { error: "Необходима авторизация" };

        const title = formData.get('title') as string;
        const link = formData.get('link') as string;
        const price = formData.get('price') as string;
        const isHint = formData.get('isHint') === 'on';
        const tagsRaw = formData.get('tags') as string;
        const category = formData.get('category') as string || 'general';
        const photo = formData.get('photo') as File | null;

        if (!title.trim()) return { error: "Название обязательно" };

        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

        // Handle optional photo upload
        let photoUrl: string | null = null;
        if (photo && photo.size > 0) {
            try {
                await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => { });
                const fileExt = photo.name.split('.').pop() || 'jpg';
                const fileName = `wish-${user.id}-${Date.now()}.${fileExt}`;
                const filePath = path.join(UPLOADS_DIR, fileName);
                const buffer = new Uint8Array(await photo.arrayBuffer());
                await fs.writeFile(filePath, buffer);
                photoUrl = `/api/images/${fileName}`;
            } catch (e) {
                console.error("Wishlist photo save error", e);
                // Non-fatal: continue without photo
            }
        }

        const { error: insertError } = await supabase
            .from('wishlist')
            .insert({
                user_id: user.id,
                title,
                link: link || null,
                price: price || null,
                tags,
                is_hint: isHint,
                category,
                photo_url: photoUrl,
            });

        if (insertError) {
            console.error("Wishlist insert error", insertError);
            return { error: "Ошибка сохранения желания" };
        }

        revalidatePath("/wishlist");
        return { success: true };

    } catch (err) {
        console.error("addWishlistItemAction exception", err);
        return { error: "Внутренняя ошибка сервера" };
    }
}

export async function updateWishlistStatusAction(itemId: string, newStatus: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('wishlist')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', itemId);

        if (error) return { error: "Ошибка обновления статуса" };

        revalidatePath("/wishlist");
        return { success: true };
    } catch {
        return { error: "Внутренняя ошибка сервера" };
    }
}
