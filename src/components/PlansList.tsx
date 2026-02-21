"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { pickPlanSlotAction, sendPlanReminderAction } from '@/app/actions/plans';

type Plan = {
    id: string;
    creator_id: string;
    title: string;
    description: string | null;
    suggested_slots: string[];
    chosen_slot: string | null;
    status: string;
    created_at: string;
};

export default function PlansList() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [myUserId, setMyUserId] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchUserAndPlans = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setMyUserId(user.id);

            const { data } = await supabase
                .from('plans')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setPlans(data as Plan[]);
        };
        fetchUserAndPlans();

        const channel = supabase
            .channel('plans_feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => {
                fetchUserAndPlans();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    const handlePickSlot = async (planId: string, slot: string) => {
        const toastId = toast.loading('Подтверждаем...');
        const res = await pickPlanSlotAction(planId, slot);
        if (res.error) {
            toast.error(res.error, { id: toastId });
        } else {
            toast.success('Время выбрано! 🎉', { id: toastId });
        }
    };

    const handleRemind = async (planId: string) => {
        const toastId = toast.loading('Отправляем напоминалку...');
        const res = await sendPlanReminderAction(planId);
        if (res.error) {
            toast.error(res.error, { id: toastId });
        } else {
            toast.success('Напоминание отправлено!', { id: toastId });
        }
    };

    if (plans.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-16 text-center opacity-70">
                <span className="text-7xl drop-shadow-sm mb-4">🛋️</span>
                <p className="font-bold text-lg text-[#4a403b] dark:text-[#d4c8c1]">Здесь пока пусто</p>
                <p className="text-sm text-[#4a403b]/80 dark:text-[#d4c8c1]/80 mt-1">Самое время запланировать что-то особенное! ✨</p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-5">
            {plans.map(plan => {
                const isCreator = plan.creator_id === myUserId;
                const isLocked = plan.status === 'locked';

                return (
                    <div key={plan.id} className={`p-5 rounded-3xl border-2 transition-all flex flex-col gap-3 ${isLocked ? 'bg-[#f0f9f0] dark:bg-[#203320] border-[#a3d9a3] opacity-90' : 'bg-white dark:bg-[#2d2621] border-[#e3d2b3] dark:border-[#55331a]'}`}>
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold font-serif leading-tight pr-2">{plan.title}</h3>
                            <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider bg-[#f5eedc] dark:bg-[#452a17] text-[#9e6b36] dark:text-[#cca573] whitespace-nowrap">
                                {isLocked ? 'Запланировано 🎯' : 'На обсуждении ⏳'}
                            </span>
                        </div>

                        {plan.description && (
                            <p className="text-sm opacity-80 whitespace-pre-wrap">{plan.description}</p>
                        )}

                        {!isLocked && plan.suggested_slots && plan.suggested_slots.length > 0 && (
                            <div className="mt-2 flex flex-col gap-2">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Выбирай время:</p>
                                <div className="flex flex-wrap gap-2">
                                    {plan.suggested_slots.map(slot => (
                                        <button
                                            key={slot}
                                            onClick={() => handlePickSlot(plan.id, slot)}
                                            disabled={isCreator}
                                            className="text-sm px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-[#cca573] hover:text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:hover:bg-black/5 disabled:hover:text-current dark:disabled:hover:bg-white/10"
                                            title={isCreator ? "Партнер должен выбрать время" : "Кликни, чтобы выбрать"}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                                {isCreator && <p className="text-xs text-[#9e6b36] mt-1 italic">≈ Ждем, пока партнер выберет удобный вариант</p>}
                            </div>
                        )}

                        {isLocked && plan.chosen_slot && (
                            <div className="mt-2 bg-[#e8f4e8] dark:bg-[#1a2e1a] p-3 rounded-xl border border-[#a3d9a3] dark:border-[#3e663e]">
                                <p className="text-sm font-bold text-[#2e5c2e] dark:text-[#80b380]">
                                    📆 Выбрано время: <span className="text-black dark:text-white text-base">{plan.chosen_slot}</span>
                                </p>
                            </div>
                        )}

                        {isLocked && (
                            <button
                                onClick={() => handleRemind(plan.id)}
                                className="mt-1 text-xs font-bold text-[#b98b53] hover:text-[#9e6b36] self-start underline underline-offset-2 opacity-80 hover:opacity-100"
                            >
                                Отправить напоминалку 🔔
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
