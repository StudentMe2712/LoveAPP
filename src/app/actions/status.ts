"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkPairAction } from './auth';

export async function updateUserStatusAction(statusText: string, statusEmoji: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { }
                }
            }
        }
    );

    const { userId, pair } = await checkPairAction();
    if (!userId || !pair) return { error: 'Not authenticated or no pair' };

    // UPSERT status
    const { error } = await supabase
        .from('user_statuses')
        .upsert({
            user_id: userId,
            pair_id: pair.id,
            status_text: statusText,
            status_emoji: statusEmoji,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error("Error upserting status:", error);
        return { error: 'Failed to update status' };
    }

    return { success: true };
}

export async function getUserStatusesAction() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { }
                }
            }
        }
    );

    const { userId, pair } = await checkPairAction();
    if (!userId || !pair) return { error: 'Not authenticated or no pair' };

    const { data, error } = await supabase
        .from('user_statuses')
        .select('*')
        .eq('pair_id', pair.id);

    if (error) {
        console.error("Error fetching statuses:", error);
        return { error: 'Failed to fetch statuses', statuses: [] };
    }

    return { statuses: data || [], myId: userId, partnerId: pair.user1_id === userId ? pair.user2_id : pair.user1_id };
}

export async function getPartnerNameAction() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
                    }
                }
            }
        );

        const { userId, pair } = await checkPairAction();
        if (!userId || !pair) return { name: null };

        const partnerId = pair.user1_id === userId ? pair.user2_id : pair.user1_id;

        // Try the profiles table (display_name column)
        const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', partnerId)
            .single();

        if (data?.display_name) return { name: data.display_name as string };
        return { name: null };
    } catch {
        return { name: null };
    }
}
