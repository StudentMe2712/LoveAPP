"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInWithPasswordAction(username: string, pass: string) {
    const supabase = await createClient();
    const email = `${username.trim().toLowerCase()}@domik.local`;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
    });

    if (error) {
        // If login fails, try to sign up automatically (if not already registered)
        if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password: pass,
            });

            if (signUpError) {
                console.error("SignUp error", signUpError);
                return { error: "Неверный логин или пароль." };
            }

            // Retry sign in
            const { error: retryError } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (retryError) {
                return { error: "Пользователь создан, но вход запрещен. Вам нужно отключить 'Confirm email' в настройках Supabase." };
            }
            return { success: true };
        }

        console.error("Auth error", error);
        return { error: "Неверный логин или пароль." };
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
    let userId = user?.id || "00000000-0000-0000-0000-000000000000";

    const { data: pair } = await supabase
        .from('pair')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .maybeSingle();

    if (!pair) {
        return { requirePair: true, userId: userId };
    }

    return { success: true, pair };
}

export async function joinPairAction(partnerId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userId = "00000000-0000-0000-0000-000000000000";

    if (userId === partnerId) {
        return { error: "Нельзя создать пару с самим собой!" };
    }

    // Insert pair
    const { error } = await supabase
        .from('pair')
        .insert({
            user1_id: userId,
            user2_id: partnerId
        });

    if (error) {
        console.error("Join pair error", error);
        return { error: "Не удалось создать пару. Возможно этот код неверен или партнер уже в паре." };
    }

    return { success: true };
}
