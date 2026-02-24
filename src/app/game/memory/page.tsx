"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import confetti from 'canvas-confetti';
import { hapticFeedback } from '@/lib/utils/haptics';

type Card = {
    id: number;
    imageUrl: string;
    pairIndex: number;
    isFlipped: boolean;
    isMatched: boolean;
};

const EMOJI_FALLBACK = ['🌸', '🌙', '⭐', '💫', '🌈', '🦋', '🌺', '💎'];

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

export default function MemoryPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matched, setMatched] = useState(0);
    const [loading, setLoading] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [totalPairs, setTotalPairs] = useState(0);
    const [isChecking, setIsChecking] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const initGame = useCallback(async () => {
        setLoading(true);
        setGameOver(false);
        setMoves(0);
        setMatched(0);
        setFlipped([]);

        const { data: moments } = await supabase
            .from('moments')
            .select('image_url')
            .order('created_at', { ascending: false })
            .limit(8);

        let imageUrls: string[] = [];

        if (moments && moments.length >= 4) {
            imageUrls = moments.slice(0, 8).map(m => m.image_url);
        } else {
            imageUrls = EMOJI_FALLBACK;
        }

        const pairsCount = Math.min(imageUrls.length, 8);
        setTotalPairs(pairsCount);

        const pairs: Card[] = shuffle([
            ...imageUrls.slice(0, pairsCount),
            ...imageUrls.slice(0, pairsCount),
        ]).map((url, idx) => ({
            id: idx,
            imageUrl: url,
            pairIndex: imageUrls.indexOf(url),
            isFlipped: false,
            isMatched: false,
        }));

        setCards(pairs);
        setLoading(false);
    }, [supabase]);

    useEffect(() => { initGame(); }, []);

    const handleCardClick = useCallback((cardId: number) => {
        if (isChecking) return;
        const card = cards[cardId];
        if (!card || card.isFlipped || card.isMatched) return;
        if (flipped.length >= 2) return;

        hapticFeedback.light();
        const newFlipped = [...flipped, cardId];
        setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setIsChecking(true);
            setMoves(m => m + 1);

            const [a, b] = newFlipped.map(id => cards[id]);
            setTimeout(() => {
                if (a.pairIndex === b.pairIndex) {
                    hapticFeedback.success();
                    setCards(prev => prev.map(c =>
                        newFlipped.includes(c.id) ? { ...c, isMatched: true } : c
                    ));
                    const newMatched = matched + 1;
                    setMatched(newMatched);
                    if (newMatched === totalPairs) {
                        setGameOver(true);
                        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
                        hapticFeedback.success();
                    }
                } else {
                    hapticFeedback.medium();
                    setCards(prev => prev.map(c =>
                        newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
                    ));
                }
                setFlipped([]);
                setIsChecking(false);
            }, 900);
        }
    }, [cards, flipped, matched, totalPairs, isChecking]);

    const isEmoji = (s: string) => /^\p{Emoji}/u.test(s);

    if (loading) return (
        <main className="w-full min-h-[100dvh] flex items-center justify-center">
            <div className="text-4xl animate-bounce">🃏</div>
        </main>
    );

    return (
        <main className="w-full min-h-[100dvh] flex flex-col items-center px-4 pt-12 pb-32">
            <header className="w-full flex justify-between items-center mb-6 px-2">
                <Link href="/game" className="text-2xl opacity-80">⬅️</Link>
                <h1 className="text-xl font-extrabold">Мемори 🃏</h1>
                <button onClick={initGame} className="text-sm font-bold px-3 py-1.5 bg-[#e8dfd5] dark:bg-[#3d332c] rounded-xl active:scale-95 transition-all">Заново</button>
            </header>

            {/* Stats */}
            <div className="flex gap-4 mb-6 text-center">
                <div className="bg-[#fdfbf9] dark:bg-[#2c2623] rounded-2xl px-5 py-3 border border-[#e8dfd5] dark:border-[#3d332c]">
                    <div className="text-2xl font-black text-[#cca573]">{moves}</div>
                    <div className="text-[10px] font-bold uppercase opacity-50">ходов</div>
                </div>
                <div className="bg-[#fdfbf9] dark:bg-[#2c2623] rounded-2xl px-5 py-3 border border-[#e8dfd5] dark:border-[#3d332c]">
                    <div className="text-2xl font-black text-[#81b29a]">{matched}/{totalPairs}</div>
                    <div className="text-[10px] font-bold uppercase opacity-50">пар найдено</div>
                </div>
            </div>

            {gameOver ? (
                <div className="flex flex-col items-center gap-4 mt-8 text-center">
                    <span className="text-6xl">🎉</span>
                    <h2 className="text-2xl font-black text-[#4a403b] dark:text-[#d4c8c1]">Победа!</h2>
                    <p className="text-lg opacity-70">Найдено за {moves} ходов</p>
                    <button onClick={initGame} className="px-8 py-4 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-3xl font-bold text-lg active:scale-95 transition-all shadow-lg">
                        Играть ещё
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                    {cards.map(card => (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className={`aspect-square rounded-2xl transition-all duration-300 overflow-hidden border-2 active:scale-95
                                ${card.isMatched
                                    ? 'border-[#81b29a] bg-[#81b29a]/10'
                                    : card.isFlipped
                                        ? 'border-[#cca573] bg-white dark:bg-[#2c2623]'
                                        : 'border-[#e8dfd5] dark:border-[#3d332c] bg-[#e8dfd5] dark:bg-[#3d332c]'
                                }`}
                            style={{
                                transform: card.isFlipped || card.isMatched ? 'rotateY(0deg)' : 'rotateY(180deg)',
                                transition: 'transform 0.35s ease',
                            }}
                        >
                            {(card.isFlipped || card.isMatched) && (
                                isEmoji(card.imageUrl)
                                    ? <span className="text-3xl">{card.imageUrl}</span>
                                    : <img src={card.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                            )}
                            {!card.isFlipped && !card.isMatched && (
                                <span className="text-2xl">💝</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </main>
    );
}
