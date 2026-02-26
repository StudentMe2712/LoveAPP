"use client";
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type PlanRow = {
    id: string;
    title: string;
    chosen_slot: string | null;
};

export default function PlansWidget() {
    const [plans, setPlans] = useState<PlanRow[]>([]);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchPlans = async () => {
            const { data } = await supabase
                .from('plans')
                .select('*')
                .eq('status', 'locked')
                .order('created_at', { ascending: false })
                .limit(2);
            if (data) {
                setPlans(
                    data.map((plan) => ({
                        id: String(plan.id),
                        title: String(plan.title ?? ''),
                        chosen_slot: plan.chosen_slot ? String(plan.chosen_slot) : null,
                    })),
                );
            }
        };
        fetchPlans();
    }, [supabase]);

    return (
        <div className="w-full mt-6">
            <h2 className="text-[#6b5c54] dark:text-[#a3948c] font-bold text-sm mb-2 pl-2">Скоро</h2>
            <div className="bg-[#fdfbf9] dark:bg-[#2c2623] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e8dfd5] dark:border-[#3d332c] flex flex-col gap-4">
                {plans.length > 0 ? (
                    plans.map((plan, i) => (
                        <div key={plan.id} className={`flex items-start gap-3 ${i !== plans.length - 1 ? 'border-b border-dashed border-[#e8dfd5] dark:border-[#4a403b] pb-4' : ''}`}>
                            <span className="text-xl leading-none mt-0.5">{i % 2 === 0 ? '📅' : '💼'}</span>
                            <p className="text-[15px] font-bold text-[#4a403b] dark:text-[#d4c8c1] leading-snug">
                                {plan.title} {plan.chosen_slot ? `в ${plan.chosen_slot}` : ''}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-xl opacity-60">📅</span>
                        <p className="text-[15px] font-bold text-[#4a403b] dark:text-[#d4c8c1] opacity-60">Пока ничего не запланировано 🍓</p>
                    </div>
                )}
            </div>
        </div>
    );
}
