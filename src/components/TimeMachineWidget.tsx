"use client";

import React, { useEffect, useState } from "react";
import { getTimeMachineMomentAction } from "@/app/actions/moments";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Image from "next/image";

interface Moment {
    id: string;
    sender_id: string;
    photo_url: string;
    caption: string | null;
    created_at: string;
}

export default function TimeMachineWidget() {
    const [moments, setMoments] = useState<Moment[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        getTimeMachineMomentAction().then((res) => {
            if (cancelled) return;

            const nextMoments =
                (res.moments as Moment[] | undefined) && res.moments.length > 0
                    ? (res.moments as Moment[])
                    : (res.moment ? [res.moment as Moment] : []);

            setMoments(nextMoments);
            setActiveIndex(0);
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (moments.length <= 1) return;

        const intervalId = window.setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % moments.length);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [moments.length]);

    if (loading || moments.length === 0) return null;

    const currentMoment = moments[activeIndex] ?? moments[0];
    const timeAgo = formatDistanceToNow(parseISO(currentMoment.created_at), { addSuffix: true, locale: ru });

    return (
        <div className="w-full mb-6">
            <h3 className="font-extrabold text-lg text-[#4a403b] dark:text-[#d4c8c1] mb-3 flex items-center gap-2">
                <span>⏱️</span> Машина Времени
            </h3>

            <div className="bg-[#fdfbf9] dark:bg-[#2c2623] p-4 pb-6 rounded-sm shadow-[2px_4px_16px_rgba(0,0,0,0.1)] border border-[#e8dfd5] dark:border-[#3d332c] transform rotate-[-2deg] transition-transform hover:rotate-0">
                <div className="relative w-full aspect-square bg-[#e8dfd5] dark:bg-[#1a1614] rounded-sm overflow-hidden mb-3 border border-[#e8dfd5]/50 dark:border-[#3d332c]/50">
                    <Image
                        src={currentMoment.photo_url}
                        alt="Time Machine Moment"
                        fill
                        className="object-cover"
                        sizes="(max-width: 400px) 100vw, 400px"
                    />
                </div>
                <div className="flex flex-col items-center">
                    <p className="font-serif text-[#4a403b] dark:text-[#d4c8c1] font-bold text-center leading-tight">
                        {currentMoment.caption || "Прекрасный момент"}
                    </p>
                    <span className="text-sm font-bold opacity-50 mt-1 uppercase tracking-widest text-[#4a403b] dark:text-[#d4c8c1]">
                        {timeAgo}
                    </span>
                    {moments.length > 1 && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-50 text-[#4a403b] dark:text-[#d4c8c1]">
                                {activeIndex + 1}/{moments.length}
                            </span>
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                                {moments.map((moment, index) => (
                                    <button
                                        key={moment.id}
                                        type="button"
                                        onClick={() => setActiveIndex(index)}
                                        className={`h-1.5 w-1.5 rounded-full transition-all ${index === activeIndex
                                            ? "bg-[#cca573]"
                                            : "bg-[#e8dfd5] dark:bg-[#3d332c]"
                                            }`}
                                        aria-label={`moment-${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
