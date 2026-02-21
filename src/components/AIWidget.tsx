"use client";

import React, { useEffect, useState } from 'react';
import { fetchAIInsightAction, confirmAIProposalAction } from '@/app/actions/ai';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleConfirm = async () => {
        if (!insight?.proposalType || !insight?.proposalPayload) return;

        setIsConfirming(true);
        const toastId = toast.loading('Отправляем...');

        try {
            const res = await confirmAIProposalAction(insight.proposalType, insight.proposalPayload);
            if (res.error) {
                toast.error(res.error, { id: toastId });
            } else {
                toast.success('Успешно отправлено! ✨', { id: toastId });
                setConfirmed(true);
            }
        } catch (err) {
            toast.error('Произошла ошибка', { id: toastId });
        } finally {
            setIsConfirming(false);
        }
    };

    useEffect(() => {
        const loadInsight = async () => {
            try {
                const res = await fetchAIInsightAction();
                if (res.data) {
                    setInsight(res.data);
                }
            } catch (err) {
                console.error("Failed to load AI insight", err);
            } finally {
                setLoading(false);
            }
        };

        // Delay slighty so it doesn't block main paint
        const timer = setTimeout(loadInsight, 1500);
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
            <div className="bg-gradient-to-br from-[#fff3f5] to-[#fdfbf9] dark:from-[#2c1f26] dark:to-[#221c1f] rounded-[24px] p-4 shadow-[0_4px_16px_rgba(255,182,193,0.15)] dark:shadow-none border border-[#ffe4e1] dark:border-[#4a2e3a]/50 relative overflow-hidden">
                {/* Sparkle decoration */}
                <div className="absolute top-2 right-2 opacity-40 text-sm">✨</div>

                <div className="flex items-start gap-3 relative z-10">
                    <div className="text-3xl shrink-0 drop-shadow-sm mt-1">🧚‍♀️</div>
                    <div className="flex-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d98b9b] dark:text-[#b06f81] mb-1">Совет дня</h3>
                        <p className="text-[15px] font-bold text-[#4a403b] dark:text-[#d4c8c1] leading-snug mb-3">
                            {insight.text}
                        </p>

                        {insight.proposalType && insight.proposalPayload ? (
                            <button
                                onClick={handleConfirm}
                                disabled={isConfirming || confirmed}
                                className={`inline-block font-bold text-xs px-4 py-2 rounded-full transition-colors active:scale-95 ${confirmed
                                        ? 'bg-[#a3d9a3]/30 text-[#203320] dark:bg-[#203320]/60 dark:text-[#a3d9a3]'
                                        : 'bg-[#ffb6c1]/30 dark:bg-[#4a2e3a]/60 hover:bg-[#ffb6c1]/50 dark:hover:bg-[#4a2e3a]/80 text-[#8a4e5c] dark:text-[#eebbcc]'
                                    }`}
                            >
                                {confirmed ? '✅ Отправлено' : (isConfirming ? 'Отправка...' : '✨ Подтвердить')}
                            </button>
                        ) : (
                            insight.action && insight.actionLabel && (
                                <Link href={insight.action} className="inline-block bg-[#ffb6c1]/30 dark:bg-[#4a2e3a]/60 hover:bg-[#ffb6c1]/50 dark:hover:bg-[#4a2e3a]/80 text-[#8a4e5c] dark:text-[#eebbcc] font-bold text-xs px-4 py-2 rounded-full transition-colors active:scale-95">
                                    {insight.actionLabel}
                                </Link>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
