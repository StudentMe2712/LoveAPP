"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { getUserStatusesAction, updateUserStatusAction } from '@/app/actions/status';
import { hapticFeedback } from '@/lib/utils/haptics';
import { useResolvedPartnerName } from '@/lib/hooks/useResolvedPartnerName';

interface StatusRow {
    id: string;
    user_id: string;
    status_text: string;
    status_emoji: string;
    updated_at: string;
}

const MOODS = [
    { emoji: '🌮', text: 'Хочу кушать' },
    { emoji: '🥺', text: 'Хочу на ручки' },
    { emoji: '💼', text: 'Работка' },
    { emoji: '🎮', text: 'Играю' },
    { emoji: '😴', text: 'Сплю' },
    { emoji: '😡', text: 'Злюсь' },
    { emoji: '🥲', text: 'Грустно' },
    { emoji: '🍷', text: 'Отдыхаю' },
    { emoji: '🎬', text: 'Смотрю кино' },
    { emoji: '🚶‍♀️', text: 'Гуляю' },
    { emoji: '🧹', text: 'Убираюсь' },
    { emoji: '🎵', text: 'Музыка' },
    { emoji: '🏃‍♂️', text: 'Тренировка' },
    { emoji: '🛁', text: 'В душе' },
    { emoji: '🚗', text: 'Еду домой' },
    { emoji: '☕', text: 'Пью кофе' },
];

export default function UserStatusWidget({ displayName, partnerName }: { displayName: string, partnerName?: string }) {
    const [statuses, setStatuses] = useState<StatusRow[]>([]);
    const [myId, setMyId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            ),
        [],
    );

    const fetchStatuses = useCallback(async () => {
        const res = await getUserStatusesAction();
        if (res.statuses) {
            setStatuses(res.statuses);
            setMyId(res.myId || null);
            setPartnerId(res.partnerId || null);
            setPartnerAvatarUrl(res.partnerAvatarUrl || null);
        }
    }, []);

    useEffect(() => {
        const initialFetchTimeout = window.setTimeout(() => {
            void fetchStatuses();
        }, 0);

        const channel = supabase.channel('public:user_statuses')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_statuses' },
                () => {
                    void fetchStatuses();
                }
            )
            .subscribe();

        return () => {
            window.clearTimeout(initialFetchTimeout);
            supabase.removeChannel(channel);
        };
    }, [fetchStatuses, supabase]);

    const handleSelectStatus = async (emoji: string, text: string) => {
        if (updating) return;
        setUpdating(true);
        hapticFeedback.light();

        // Optimistic update
        if (myId) {
            setStatuses(prev => {
                const existing = prev.find(s => s.user_id === myId);
                const newRow: StatusRow = existing
                    ? { ...existing, status_emoji: emoji, status_text: text, updated_at: new Date().toISOString() }
                    : { id: 'temp', user_id: myId, status_emoji: emoji, status_text: text, updated_at: new Date().toISOString() };
                return [...prev.filter(s => s.user_id !== myId), newRow];
            });
        }

        await updateUserStatusAction(text, emoji);
        hapticFeedback.success();
        setUpdating(false);
        setIsOpen(false);
    };

    const myStatus = statuses.find(s => s.user_id === myId);
    const partnerStatus = statuses.find(s => partnerId ? s.user_id === partnerId : s.user_id !== myId);
    const resolvedPartnerName = useResolvedPartnerName(partnerName);

    return (
        <div className="w-full mb-6 relative px-2">
            <div className="flex items-center justify-between">
                {/* Left: Greeting & My Status */}
                <div className="flex flex-col items-start pr-2">
                    <h2 className="text-3xl font-extrabold font-serif tracking-tight mb-2 drop-shadow-sm">Привет, {displayName}!</h2>
                    <button
                        onClick={() => { hapticFeedback.light(); setIsOpen(!isOpen) }}
                        className="flex items-center gap-1.5 text-sm font-bold text-[#4a403b] dark:text-[#d4c8c1] bg-[#e8dfd5] dark:bg-[#3d332c] px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    >
                        {myStatus ? (
                            <>
                                <span className="text-base leading-none">{myStatus.status_emoji}</span>
                                <span>{myStatus.status_text}</span>
                            </>
                        ) : (
                            <>
                                <span className="text-base leading-none">💭</span>
                                <span>Установить статус</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Right: Partner Status & Avatar */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-extrabold opacity-40 uppercase tracking-widest mb-0.5">{resolvedPartnerName}</span>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#4a403b] dark:text-[#d4c8c1] bg-[#fdfbf9] dark:bg-[#2c2623] px-3 py-1.5 rounded-full border border-[#e8dfd5] dark:border-[#3d332c] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                            {partnerStatus ? (
                                <>
                                    <span className="text-base leading-none">{partnerStatus.status_emoji}</span>
                                    <span>{partnerStatus.status_text}</span>
                                </>
                            ) : (
                                <span className="opacity-50 font-normal">Нет статуса</span>
                            )}
                        </div>
                    </div>
                    {partnerAvatarUrl && (
                        <Image
                            src={partnerAvatarUrl}
                            alt={`Аватар ${resolvedPartnerName}`}
                            width={56}
                            height={56}
                            unoptimized
                            className="h-14 w-14 shrink-0 rounded-full border-2 border-[#e8dfd5] object-cover shadow-sm dark:border-[#3d332c]"
                        />
                    )}
                </div>
            </div>

            {/* Modal / Dropdown for selection */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-4 shadow-xl border border-[#e8dfd5] dark:border-[#3d332c] z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                    <h4 className="font-bold mb-3 text-sm opacity-60 uppercase tracking-widest text-[#4a403b] dark:text-[#d4c8c1]">Выберите настроение:</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2 pb-2">
                        {MOODS.map(mood => (
                            <button
                                key={mood.text}
                                onClick={() => handleSelectStatus(mood.emoji, mood.text)}
                                disabled={updating}
                                className="flex items-center gap-2 bg-[#f2ebe3] dark:bg-[#1a1614] p-3 rounded-2xl active:scale-95 transition-transform text-left"
                            >
                                <span className="text-2xl leading-none">{mood.emoji}</span>
                                <span className="font-bold text-sm text-[#4a403b] dark:text-[#d4c8c1] leading-tight">{mood.text}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-3 py-3 font-bold text-[#e07a5f] bg-[#e07a5f]/10 rounded-2xl active:scale-95 transition-transform"
                    >
                        Отмена
                    </button>
                </div>
            )}
        </div>
    );
}
