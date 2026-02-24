"use client";

import React, { useEffect, useState } from 'react';
import { getTimeMachineMomentAction } from '@/app/actions/moments';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import Image from 'next/image';

interface Moment {
    id: string;
    photo_url: string;
    caption: string | null;
    created_at: string;
}

export default function TimeMachineWidget() {
    const [moment, setMoment] = useState<Moment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTimeMachineMomentAction().then(res => {
            if (res.moment) setMoment(res.moment);
            setLoading(false);
        });
    }, []);

    if (loading || !moment) return null;

    const timeAgo = formatDistanceToNow(parseISO(moment.created_at), { addSuffix: true, locale: ru });

    return (
        <div className="w-full mb-6">
            <h3 className="font-extrabold text-lg text-[#4a403b] dark:text-[#d4c8c1] mb-3 flex items-center gap-2">
                <span>⏱️</span> Машина Времени
            </h3>

            <div className="bg-[#fdfbf9] dark:bg-[#2c2623] p-4 pb-6 rounded-sm shadow-[2px_4px_16px_rgba(0,0,0,0.1)] border border-[#e8dfd5] dark:border-[#3d332c] transform rotate-[-2deg] transition-transform hover:rotate-0">
                <div className="relative w-full aspect-square bg-[#e8dfd5] dark:bg-[#1a1614] rounded-sm overflow-hidden mb-3 border border-[#e8dfd5]/50 dark:border-[#3d332c]/50">
                    <Image
                        src={moment.photo_url}
                        alt="Time Machine Moment"
                        fill
                        className="object-cover"
                        sizes="(max-width: 400px) 100vw, 400px"
                    />
                </div>
                <div className="flex flex-col items-center">
                    <p className="font-serif text-[#4a403b] dark:text-[#d4c8c1] font-bold text-center leading-tight">
                        {moment.caption || "Прекрасный момент"}
                    </p>
                    <span className="text-sm font-bold opacity-50 mt-1 uppercase tracking-widest text-[#4a403b] dark:text-[#d4c8c1]">
                        {timeAgo}
                    </span>
                </div>
            </div>
        </div>
    );
}
