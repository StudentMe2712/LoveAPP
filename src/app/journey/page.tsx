"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { differenceInYears, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import confetti from 'canvas-confetti';

interface FloatingHeart {
    id: number;
    x: number;
    size: number;
    opacity: number;
    color: string;
    duration: number;
}

const HEART_COLORS = ['#e07a5f', '#f2cc8f', '#81b29a', '#f4a261', '#e76f51', '#ff69b4', '#ff1493'];

export default function JourneyPage() {
    const [startedAt, setStartedAt] = useState<Date | null>(null);
    const [now, setNow] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [hearts, setHearts] = useState<FloatingHeart[]>([]);
    const [clickCount, setClickCount] = useState(0);
    const [pulse, setPulse] = useState(false);
    const heartIdRef = useRef(0);

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
    }, []);

    useEffect(() => {
        if (!startedAt) return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    const handleHeartClick = useCallback(() => {
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }

        // Pulse animation
        setPulse(true);
        setTimeout(() => setPulse(false), 300);

        setClickCount(prev => {
            const newCount = prev + 1;
            // Confetti every 10 clicks
            if (newCount % 10 === 0) {
                confetti({
                    particleCount: 60,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: HEART_COLORS,
                    shapes: ['circle'],
                });
            }
            return newCount;
        });

        // Spawn floating hearts
        const count = Math.floor(Math.random() * 3) + 1;
        const newHearts: FloatingHeart[] = Array.from({ length: count }, () => {
            heartIdRef.current += 1;
            return {
                id: heartIdRef.current,
                x: 35 + Math.random() * 30, // % from left
                size: 16 + Math.random() * 24,
                opacity: 0.6 + Math.random() * 0.4,
                color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
                duration: 1.2 + Math.random() * 0.8,
            };
        });

        setHearts(prev => [...prev, ...newHearts]);
        setTimeout(() => {
            const ids = newHearts.map(h => h.id);
            setHearts(prev => prev.filter(h => !ids.includes(h.id)));
        }, 2000);
    }, []);

    // Timer calculations
    let years = 0, days = 0, hours = 0, minutes = 0, seconds = 0;
    if (startedAt) {
        years = differenceInYears(now, startedAt);
        const afterYears = new Date(startedAt);
        afterYears.setFullYear(afterYears.getFullYear() + years);
        days = differenceInDays(now, afterYears);
        const afterDays = new Date(afterYears);
        afterDays.setDate(afterDays.getDate() + days);
        hours = differenceInHours(now, afterDays);
        const afterHours = new Date(afterDays);
        afterHours.setHours(afterHours.getHours() + hours);
        minutes = differenceInMinutes(now, afterHours);
        const afterMinutes = new Date(afterHours);
        afterMinutes.setMinutes(afterMinutes.getMinutes() + minutes);
        seconds = differenceInSeconds(now, afterMinutes);
    }

    const heartLevel = Math.min(clickCount, 100);
    const heartEmoji = clickCount === 0 ? '🤍' : clickCount < 5 ? '🩷' : clickCount < 15 ? '💕' : clickCount < 30 ? '💖' : clickCount < 50 ? '💗' : '💓';

    return (
        <main className="w-full min-h-[100dvh] flex flex-col items-center px-6 pt-12 pb-32 relative overflow-hidden">
            {/* Floating hearts */}
            {hearts.map(heart => (
                <div
                    key={heart.id}
                    className="absolute pointer-events-none z-50 animate-float-up"
                    style={{
                        left: `${heart.x}%`,
                        bottom: '45%',
                        fontSize: `${heart.size}px`,
                        color: heart.color,
                        opacity: heart.opacity,
                        animation: `floatUp ${heart.duration}s ease-out forwards`,
                    }}
                >
                    ❤️
                </div>
            ))}

            <style jsx>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-200px) scale(0.3); opacity: 0; }
                }
            `}</style>

            {/* Header */}
            <header className="w-full flex justify-between items-center mb-8">
                <Link href="/" className="text-2xl opacity-80 hover:opacity-100 transition-opacity">⬅️</Link>
                <h1 className="text-2xl font-extrabold tracking-tight">Наш Путь 💑</h1>
                <div className="w-8" />
            </header>

            {/* Timer Block */}
            <section className="w-full bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#e8dfd5] dark:border-[#3d332c] mb-8 flex flex-col items-center">
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest opacity-50 mb-5 text-[#4a403b] dark:text-[#d4c8c1]">Мы вместе уже</h2>

                {loading ? (
                    <div className="h-16 w-48 bg-[#e8dfd5]/40 dark:bg-[#3d332c]/40 rounded-2xl animate-pulse" />
                ) : !startedAt ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                        <span className="text-4xl">⏳</span>
                        <p className="font-bold text-sm text-[#4a403b] dark:text-[#d4c8c1]">
                            Установите дату начала отношений, чтобы запустить таймер!
                        </p>
                        <Link href="/settings" className="px-5 py-2.5 bg-[#cca573] hover:bg-[#b98b53] text-white text-sm font-bold rounded-2xl transition-colors active:scale-95">
                            В настройки →
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-end justify-center gap-3 font-serif text-[#4a403b] dark:text-[#d4c8c1]">
                        {years > 0 && (
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-black leading-none">{years}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-50">лет</span>
                            </div>
                        )}
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black leading-none">{days}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-50">дн</span>
                        </div>
                        <span className="opacity-25 pb-2.5 text-2xl font-light">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black leading-none">{hours.toString().padStart(2, '0')}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-50">ч</span>
                        </div>
                        <span className="opacity-25 pb-2.5 text-2xl font-light">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black leading-none">{minutes.toString().padStart(2, '0')}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-50">м</span>
                        </div>
                        <span className="opacity-30 pb-2.5 text-2xl font-light animate-pulse">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black leading-none text-[#e07a5f]">{seconds.toString().padStart(2, '0')}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 text-[#e07a5f]">с</span>
                        </div>
                    </div>
                )}
            </section>

            {/* Anti-stress Heart Clicker */}
            <section className="w-full flex flex-col items-center gap-6">
                <div className="text-center">
                    <h2 className="text-xl font-extrabold text-[#4a403b] dark:text-[#d4c8c1] mb-1">Антистресс ❤️</h2>
                    <p className="text-sm opacity-50 text-[#4a403b] dark:text-[#d4c8c1]">Нажми на сердце и почувствуй тепло</p>
                </div>

                {/* Main heart button */}
                <button
                    onClick={handleHeartClick}
                    className="relative flex items-center justify-center select-none outline-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    <div
                        className="transition-all duration-150"
                        style={{
                            fontSize: `${100 + heartLevel * 0.5}px`,
                            filter: `drop-shadow(0 0 ${8 + heartLevel * 0.3}px rgba(224, 122, 95, ${0.3 + heartLevel * 0.005}))`,
                            transform: pulse ? 'scale(0.88)' : 'scale(1)',
                            transition: 'transform 0.15s ease, filter 0.3s ease, font-size 0.5s ease',
                        }}
                    >
                        {heartEmoji}
                    </div>
                </button>

                {/* Click counter */}
                {clickCount > 0 && (
                    <div className="flex flex-col items-center gap-1 animate-in fade-in duration-300">
                        <span className="text-3xl font-black text-[#e07a5f]">{clickCount}</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-40 text-[#4a403b] dark:text-[#d4c8c1]">
                            {clickCount === 1 ? 'нажатие' : clickCount < 5 ? 'нажатия' : 'нажатий'}
                        </span>
                        {clickCount >= 10 && <span className="text-xs opacity-50">🎉 так держать!</span>}
                        {clickCount >= 50 && <span className="text-xs text-[#e07a5f] font-bold">💓 ты профессионал любви!</span>}
                    </div>
                )}

                {clickCount === 0 && (
                    <p className="text-xs opacity-30 text-center text-[#4a403b] dark:text-[#d4c8c1] mt-2">
                        нажимай быстрее — чем больше, тем больше любви! 🌸
                    </p>
                )}
            </section>
        </main>
    );
}
