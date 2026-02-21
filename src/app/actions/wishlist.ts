"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

        if (!title.trim()) return { error: "Название обязательно" };

        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

        const { error: insertError } = await supabase
            .from('wishlist')
            .insert({
                user_id: user.id,
                title,
                link: link || null,
                price: price || null,
                tags,
                is_hint: isHint
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
