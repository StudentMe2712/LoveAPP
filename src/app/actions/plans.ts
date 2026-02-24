"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

export async function createPlanAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Вы не авторизованы" };
        }

        const title = formData.get("title")?.toString().trim();
        const description = formData.get("description")?.toString().trim();
        const targetDate = formData.get("target_date")?.toString().trim();
        const rawSlots = formData.getAll("suggested_slots");

        if (!title) {
            return { error: "Название плана обязательно" };
        }

        const suggested_slots = rawSlots.map(s => s.toString().trim()).filter(Boolean);

        const { error } = await supabase.from("plans").insert({
            creator_id: user.id,
            title,
            description,
            suggested_slots,
            target_date: targetDate || null,
            status: "proposed"
        });

        if (error) {
            console.error("Ошибка при создании плана:", error);
            return { error: "Не удалось сохранить план" };
        }

        revalidatePath("/plans");
        return { success: true };
    } catch (err) {
        console.error("createPlanAction exception", err);
        return { error: "Внутренняя ошибка сервера" };
    }
}

export async function pickPlanSlotAction(planId: string, chosenSlot: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Вы не авторизованы" };
        }

        const { error } = await supabase
            .from("plans")
            .update({
                chosen_slot: chosenSlot,
                status: "locked"
            })
            .eq("id", planId);

        if (error) {
            console.error("Ошибка при выборе слота:", error);
            return { error: "Не удалось сохранить выбор" };
        }

        revalidatePath("/plans");
        return { success: true };
    } catch (err) {
        console.error("pickPlanSlotAction exception", err);
        return { error: "Внутренняя ошибка сервера" };
    }
}

export async function sendPlanReminderAction(planId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Вы не авторизованы" };
        }

        const { data: plan, error: planError } = await supabase.from("plans").select("*").eq("id", planId).single();
        if (planError || !plan) {
            return { error: "План не найден" };
        }

        const partnerTelegramId = process.env.TEST_PARTNER_TELEGRAM_ID;
        if (partnerTelegramId) {
            const message = `🔔 <b>Напоминание о планах!</b>\n\n🗓 Мы договорились: <b>${plan.title}</b>\n⏰ Время: <b>${plan.chosen_slot || "не задано"}</b>\n\nНе забудь! 😉`;
            await sendTelegramMessage(partnerTelegramId, message);
        }

        return { success: true };
    } catch (err) {
        console.error("sendPlanReminderAction exception", err);
        return { error: "Внутренняя ошибка сервера" };
    }
}

