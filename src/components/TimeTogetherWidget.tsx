"use client";

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { differenceInYears, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import Link from 'next/link';

export default function TimeTogetherWidget() {
    const [startedAt, setStartedAt] = useState<Date | null>(null);
    const [now, setNow] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchDate = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.anniversary_date) {
                setStartedAt(new Date(user.user_metadata.anniversary_date));
            }
            setLoading(false);
        };
        fetchDate();
    }, [supabase]);

    useEffect(() => {
        if (!startedAt) return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    if (loading) return null;

    if (!startedAt) {
        return (
            <div className="w-full bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] mb-6 flex flex-col items-center justify-center text-center">
                <span className="text-3xl drop-shadow-sm mb-2">⏳</span>
                <p className="font-bold text-sm text-[#4a403b] dark:text-[#d4c8c1] leading-tight mb-2">
                    Установите дату начала отношений, чтобы запустить таймер!
                </p>
                <Link href="/settings" className="px-4 py-2 bg-[#cca573] hover:bg-[#b98b53] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors">
                    В настройки
                </Link>
            </div>
        );
    }

    let years = differenceInYears(now, startedAt);
    let dateAfterYears = new Date(startedAt);
    dateAfterYears.setFullYear(dateAfterYears.getFullYear() + years);

    let days = differenceInDays(now, dateAfterYears);
    let dateAfterDays = new Date(dateAfterYears);
    dateAfterDays.setDate(dateAfterDays.getDate() + days);

    let hours = differenceInHours(now, dateAfterDays);
    let dateAfterHours = new Date(dateAfterDays);
    dateAfterHours.setHours(dateAfterHours.getHours() + hours);

    let minutes = differenceInMinutes(now, dateAfterHours);
    let dateAfterMinutes = new Date(dateAfterHours);
    dateAfterMinutes.setMinutes(dateAfterMinutes.getMinutes() + minutes);

    let seconds = differenceInSeconds(now, dateAfterMinutes);

    return (
        <div className="w-full bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] mb-6 flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest opacity-50 mb-3 text-[#4a403b] dark:text-[#d4c8c1]">Мы вместе уже</h3>
            <div className="flex items-end justify-center gap-[6px] font-serif text-[#4a403b] dark:text-[#d4c8c1]">
                {years > 0 && <div className="flex flex-col items-center"><span className="text-3xl font-black leading-none">{years}</span><span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">лет</span></div>}

                <div className="flex flex-col items-center"><span className="text-3xl font-black leading-none">{days}</span><span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">дн</span></div>
                <span className="opacity-30 pb-2 text-xl font-sans font-light">:</span>

                <div className="flex flex-col items-center"><span className="text-3xl font-black leading-none">{hours.toString().padStart(2, '0')}</span><span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">ч</span></div>
                <span className="opacity-30 pb-2 text-xl font-sans font-light">:</span>

                <div className="flex flex-col items-center"><span className="text-3xl font-black leading-none">{minutes.toString().padStart(2, '0')}</span><span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">м</span></div>
                <span className="opacity-40 pb-2 text-xl font-sans font-light animate-pulse">:</span>

                <div className="flex flex-col items-center"><span className="text-3xl font-black leading-none text-[#e07a5f]">{seconds.toString().padStart(2, '0')}</span><span className="text-[9px] font-bold uppercase tracking-widest mt-1 text-[#e07a5f]">с</span></div>
            </div>
        </div>
    );
}
