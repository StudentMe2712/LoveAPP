"use client";

import React, { useEffect, useState } from 'react';
import { fetchAIInsightAction } from '@/app/actions/ai';
import toast from 'react-hot-toast';
import { hapticFeedback } from '@/lib/utils/haptics';

type AIInsight = {
    text: string;
    action?: string;
    actionLabel?: string;
    proposalType?: 'message' | 'plan';
    proposalPayload?: string;
};

export default function AIWidget() {
    const [insight, setInsight] = useState<AIInsight | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadInsight = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetchAIInsightAction();
            if (res.data) setInsight(res.data);
        } catch (err) {
            console.error('Failed to load AI insight', err);
            toast.error('Не удалось загрузить совет');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchAIInsightAction();
                if (res.data) setInsight(res.data);
            } catch (err) {
                console.error('Failed to load AI insight', err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(load, 1500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="w-full mt-4 animate-pulse">
                <div className="bg-gradient-to-r from-[#ffe4e1]/50 to-[#ffb6c1]/20 dark:from-[#2a1b24] dark:to-[#2c1f26] rounded-[24px] p-4 border border-[#ffb6c1]/30 dark:border-[#4a2e3a]/30 flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ffb6c1]/20 dark:bg-[#4a2e3a]/50 shrink-0"></div>
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-[#e8dfd5]/50 dark:bg-[#3d332c]/50 rounded w-3/4"></div>
                        <div className="h-3 bg-[#e8dfd5]/50 dark:bg-[#3d332c]/50 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!insight?.text) return null;

    return (
        <div className="w-full mt-4">
            {/* Glowing gradient border ring */}
            <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-[#ffb6c1] via-[#cca573] to-[#e07a5f] shadow-[0_0_28px_rgba(255,182,193,0.5)] dark:shadow-[0_0_28px_rgba(204,165,115,0.3)]">
                <div className="bg-gradient-to-br from-[#fff8f9] to-[#fdf4ec] dark:from-[#2c1f26] dark:to-[#2a1e1a] rounded-[26px] p-4 relative overflow-hidden">
                    {/* Blurred accent blobs */}
                    <div className="absolute -top-5 -right-5 w-28 h-28 bg-[#ffb6c1]/25 dark:bg-[#ffb6c1]/8 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-[#cca573]/20 dark:bg-[#cca573]/8 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-start gap-3 relative z-10">
                        <div className="text-4xl shrink-0 drop-shadow-md">🧚‍♀️</div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[#e07a5f] to-[#cca573] bg-clip-text text-transparent block mb-1.5">
                                ✨ Совет дня
                            </span>
                            <p className="text-[15px] font-semibold text-[#4a403b] dark:text-[#e0d4cb] leading-snug mb-3 italic">
                                «{insight.text}»
                            </p>
                            <button
                                onClick={() => { hapticFeedback.light(); loadInsight(); }}
                                disabled={isRefreshing}
                                className={`inline-flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-full transition-all active:scale-95 bg-gradient-to-r from-[#ffb6c1]/40 to-[#cca573]/30 dark:from-[#4a2e3a]/60 dark:to-[#3d2a1e]/60 hover:opacity-80 text-[#8a4e5c] dark:text-[#eebbcc] ${isRefreshing ? 'opacity-50' : ''}`}
                            >
                                <span className={isRefreshing ? 'animate-spin inline-block' : ''}>🎲</span> Обновить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
