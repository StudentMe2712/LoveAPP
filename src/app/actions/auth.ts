"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInWithEmailAction(email: string) {
    const supabase = await createClient();
    // Use the origin from headers, fallback to localhost for safety in dev
    let origin = 'http://localhost:3000';
    try {
        if (process.env.NEXT_PUBLIC_SITE_URL) {
            origin = process.env.NEXT_PUBLIC_SITE_URL;
        } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
            origin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
        } else if (process.env.VERCEL_URL) {
            origin = `https://${process.env.VERCEL_URL}`;
        } else {
            const h = await headers();
            const originHeader = h.get('origin') || h.get('host');
            if (originHeader) {
                origin = originHeader.startsWith('http') ? originHeader : `https://${originHeader}`;
            }
        }
    } catch {
        // ignore
    }

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${origin}/auth/confirm`,
        },
    });

    if (error) {
        console.error("Auth error", error);
        return { error: "Не удалось отправить ссылку на email." };
    }
    return { success: true };
}

export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}

export async function checkPairAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { requireLogin: true };

    const { data: pair } = await supabase
        .from('pair')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .maybeSingle();

    if (!pair) {
        return { requirePair: true, userId: user.id };
    }

    return { success: true, pair };
}

export async function joinPairAction(partnerId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Не авторизован" };

    if (user.id === partnerId) {
        return { error: "Нельзя создать пару с самим собой!" };
    }

    // Insert pair
    const { error } = await supabase
        .from('pair')
        .insert({
            user1_id: user.id,
            user2_id: partnerId
        });

    if (error) {
        console.error("Join pair error", error);
        return { error: "Не удалось создать пару. Возможно этот код неверен или партнер уже в паре." };
    }

    return { success: true };
}
