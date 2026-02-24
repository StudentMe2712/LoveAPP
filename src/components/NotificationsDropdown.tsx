"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

type Signal = {
    id: string;
    sender_id: string;
    type: string;
    created_at: string;
    acknowledged: boolean;
};

export default function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [signals, setSignals] = useState<Signal[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchSignals = async () => {
            const { data } = await supabase
                .from('signals')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                setSignals(data as Signal[]);
                setUnreadCount(data.filter(s => !s.acknowledged).length);
            }
        };

        fetchSignals();

        const channel = supabase
            .channel('signals_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, () => {
                fetchSignals();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Mark all as read
            const unreadIds = signals.filter(s => !s.acknowledged).map(s => s.id);
            if (unreadIds.length > 0) {
                await supabase.from('signals').update({ acknowledged: true }).in('id', unreadIds);
                setUnreadCount(0);
                setSignals(prev => prev.map(s => ({ ...s, acknowledged: true })));
            }
        }
    };

    const getSignalText = (type: string) => {
        switch (type) {
            case 'miss_you': return '🧸 Скучаю';
            case 'want_to_talk': return '💬 Хочу поговорить';
            case 'hugs': return '🫂 Обнимашки';
            case 'heavy': return '💔 Мне тяжело';
            default: return '🔔 Уведомление';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={markAsRead}
                aria-label="Уведомления"
                className="relative w-9 h-9 rounded-full border border-[#d4c8c1] dark:border-[#4a403b] flex items-center justify-center bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-[#3d332c] transition-colors"
            >
                <span className="text-lg opacity-80 pb-0.5">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center pt-[1px]">{unreadCount}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-72 bg-[#fcf8ef] dark:bg-[#2c2623] border border-[#e8dfd5] dark:border-[#3d332c] rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-96">
                    <div className="p-3 border-b border-[#e8dfd5] dark:border-[#4a403b] bg-[#f2ebe3] dark:bg-[#1a1614] flex justify-between items-center">
                        <h3 className="font-bold text-sm text-[#4a403b] dark:text-[#d4c8c1]">Уведомления</h3>
                        <span className="text-xs opacity-60">Последние 10</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-2">
                        {signals.length === 0 ? (
                            <div className="p-4 text-center opacity-70 text-sm font-medium">
                                Пока ничего нет 🤷‍♂️
                            </div>
                        ) : (
                            signals.map(s => (
                                <div key={s.id} className={`p-3 rounded-xl text-sm border flex flex-col gap-1 transition-colors ${!s.acknowledged ? 'bg-white dark:bg-[#3d332c] border-[#cca573] dark:border-[#b98b53]' : 'bg-[#fdfbf9]/50 dark:bg-[#1f1a16] border-transparent opacity-80'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold">{getSignalText(s.type)}</span>
                                        {!s.acknowledged && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></span>}
                                    </div>
                                    <span className="text-[10px] uppercase opacity-60 font-semibold tracking-wider">
                                        {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ru })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
