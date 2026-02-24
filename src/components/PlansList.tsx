"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { pickPlanSlotAction, sendPlanReminderAction } from '@/app/actions/plans';
import { hapticFeedback } from '@/lib/utils/haptics';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import confetti from 'canvas-confetti';

type Plan = {
    id: string;
    creator_id: string;
    title: string;
    description: string | null;
    suggested_slots: string[];
    chosen_slot: string | null;
    status: string;
    target_date?: string | null;
    created_at: string;
};

export default function PlansList() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [myUserId, setMyUserId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [currentMonth, setCurrentMonth] = useState(new Date());

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
        hapticFeedback.light();
        const toastId = toast.loading('Подтверждаем...');
        const res = await pickPlanSlotAction(planId, slot);
        if (res.error) {
            toast.error(res.error, { id: toastId });
            hapticFeedback.heavy();
        } else {
            toast.success('Время выбрано! 🎉', { id: toastId });
            hapticFeedback.success();
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
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

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    return (
        <div className="w-full flex flex-col gap-5">
            <div className="flex bg-[#e8dfd5] dark:bg-[#3d332c] p-1 rounded-2xl w-full mb-2">
                <button onClick={() => setViewMode('list')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${viewMode === 'list' ? 'bg-[#fdfbf9] dark:bg-[#1a1614] text-[#9e6b36] dark:text-[#cca573] shadow-sm' : 'opacity-60 text-current hover:opacity-100'}`}>Список</button>
                <button onClick={() => setViewMode('calendar')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${viewMode === 'calendar' ? 'bg-[#fdfbf9] dark:bg-[#1a1614] text-[#9e6b36] dark:text-[#cca573] shadow-sm' : 'opacity-60 text-current hover:opacity-100'}`}>Календарь</button>
            </div>

            {viewMode === 'calendar' ? (
                <div className="w-full bg-[#fdfbf9] dark:bg-[#2c2623] p-4 rounded-3xl border border-[#e8dfd5] dark:border-[#3d332c] shadow-sm animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <button onClick={prevMonth} className="px-3 py-1 bg-black/5 dark:bg-white/10 rounded-lg hover:bg-[#cca573] hover:text-white transition-colors">◀</button>
                        <h3 className="font-bold text-lg capitalize">{format(currentMonth, 'LLLL yyyy', { locale: ru })}</h3>
                        <button onClick={nextMonth} className="px-3 py-1 bg-black/5 dark:bg-white/10 rounded-lg hover:bg-[#cca573] hover:text-white transition-colors">▶</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                            <div key={d} className="font-bold text-xs opacity-50">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map(day => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const dayPlans = plans.filter(p => p.target_date && isSameDay(parseISO(p.target_date), day));
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div key={day.toString()} className={`aspect-square flex flex-col items-center justify-start py-2 px-1 rounded-xl border transition-all ${isCurrentMonth ? 'bg-white dark:bg-[#1f1a16] border-[#e8dfd5] dark:border-[#3d332c]' : 'bg-transparent border-transparent opacity-30'} ${isToday ? 'border-[#cca573] border-2 shadow-sm' : ''}`}>
                                    <span className={`text-sm font-bold ${isCurrentMonth ? '' : 'opacity-40'} ${isToday ? 'text-[#e07a5f]' : ''}`}>{format(day, 'd')}</span>
                                    <div className="flex flex-wrap gap-1 mt-1 justify-center w-full">
                                        {dayPlans.map(p => (
                                            <div key={p.id} className={`w-2.5 h-2.5 rounded-full shadow-sm ${p.status === 'locked' ? 'bg-[#81b29a]' : 'bg-[#e07a5f]'}`} title={p.title} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <>
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

                                <div className="flex justify-between items-center mt-3">
                                    {isLocked && (
                                        <button
                                            onClick={() => handleRemind(plan.id)}
                                            className="text-xs font-bold text-[#b98b53] hover:text-[#9e6b36] underline underline-offset-2 opacity-80 hover:opacity-100"
                                        >
                                            Отправить напоминалку 🔔
                                        </button>
                                    )}
                                    {isCreator && (
                                        <button
                                            onClick={async () => {
                                                if (confirm("Точно удалить этот план?")) {
                                                    const { deletePlanAction } = await import('@/app/actions/delete');
                                                    const toastId = toast.loading('Удаляем...');
                                                    const res = await deletePlanAction(plan.id);
                                                    if (res.error) toast.error(res.error, { id: toastId });
                                                    else toast.success('План удален', { id: toastId });
                                                }
                                            }}
                                            className="text-xs font-bold text-red-400 hover:text-red-500 opacity-60 hover:opacity-100 ml-auto"
                                        >
                                            🗑️ Удалить
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}
