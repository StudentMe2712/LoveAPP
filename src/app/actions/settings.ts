"use server";

import { createClient } from "@/lib/supabase/server";

export async function exportDataAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let userId = user?.id;
        if (!userId) { userId = "00000000-0000-0000-0000-000000000000"; }

        // Fetch data from various tables (RLS will handle pair/user isolation)
        const [signals, moments, memoryItems, wishlist, plans] = await Promise.all([
            supabase.from("signals").select("*").limit(1000),
            supabase.from("moments").select("*").limit(100),
            supabase.from("memory_items").select("*").limit(1000),
            supabase.from("wishlist").select("*").limit(500),
            supabase.from("plans").select("*").limit(100)
        ]);

        const exportObject = {
            export_date: new Date().toISOString(),
            user_id: userId,
            data: {
                signals: signals.data || [],
                moments: moments.data || [],
                memoryItems: memoryItems.data || [],
                wishlist: wishlist.data || [],
                plans: plans.data || []
            }
        };

        return { data: JSON.stringify(exportObject, null, 2) };
    } catch (err) {
        console.error("Export error", err);
        return { error: "Не удалось экспортировать данные" };
    }
}

export async function deleteDataAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let userId = user?.id;
        if (!userId) { userId = "00000000-0000-0000-0000-000000000000"; }

        // To comply with simple delete functionality, we delete the user's records.
        // In a full production app, you might want to call an edge function to delete the Auth User itself.
        await supabase.from("signals").delete().eq("sender_id", userId);
        await supabase.from("moments").delete().eq("sender_id", userId);
        await supabase.from("memory_items").delete().eq("user_id", userId);
        await supabase.from("plans").delete().eq("creator_id", userId);

        // Wishlist items might not be linked strongly to a single user in pair, but if they are:
        await supabase.from("wishlist").delete().eq("user_id", userId);

        return { success: true };
    } catch (err) {
        console.error("Delete error", err);
        return { error: "Не удалось удалить данные" };
    }
}

export async function updateProfileAvatarAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userId = "00000000-0000-0000-0000-000000000000";

    const file = formData.get('avatar') as File;
    const displayName = formData.get('displayName') as string;

    let finalAvatarUrl = user?.user_metadata?.avatar_url;

    if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('moments')
            .upload(`avatars/${fileName}`, file);

        if (uploadError) {
            console.error("Avatar upload error", uploadError);
            return { error: "Ошибка загрузки фото" };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('moments')
            .getPublicUrl(`avatars/${fileName}`);

        finalAvatarUrl = publicUrl;
    }

    const { error } = await supabase.auth.updateUser({
        data: {
            display_name: displayName || user?.user_metadata?.display_name,
            avatar_url: finalAvatarUrl
        }
    });

    if (error) {
        return { error: "Не удалось обновить профиль" };
    }

    return { success: true };
}
