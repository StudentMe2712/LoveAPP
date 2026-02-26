"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import confetti from "canvas-confetti";
import BackButton from "@/components/BackButton";
import Card from "@/components/ui/Card";

type TimerParts = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

type FloatingReward = {
    id: number;
    label: string;
    x: number;
    y: number;
    tone: "gold" | "pink" | "mint";
};

const BONUS_REWARDS = ["💫 Плюшка!", "🫶 Обнимашки", "✨ Умничка", "🌸 Нежность", "💖 Любовь"];

function pad2(value: number): string {
    return value.toString().padStart(2, "0");
}

function buildTimer(startedAt: Date, now: Date): TimerParts {
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));

    const days = Math.floor(diffSeconds / 86400);
    const dayRest = diffSeconds % 86400;
    const hours = Math.floor(dayRest / 3600);
    const hourRest = dayRest % 3600;
    const minutes = Math.floor(hourRest / 60);
    const seconds = hourRest % 60;

    return { days, hours, minutes, seconds };
}

export default function JourneyPage() {
    const [startedAt, setStartedAt] = useState<Date | null>(null);
    const [now, setNow] = useState(() => new Date());
    const [loading, setLoading] = useState(true);
    const heartScoreRef = useRef(0);
    const autoClickEnabled = true;
    const [autoLevel, setAutoLevel] = useState(1);
    const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
    const [tapFlash, setTapFlash] = useState(false);
    const rewardIdRef = useRef(0);
    const lastTapRef = useRef(0);
    const comboRef = useRef(0);
    const autoTickRef = useRef(0);
    const autoLevelRef = useRef(1);
    const tapFlashTimeoutRef = useRef<number | null>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            ),
        [],
    );

    useEffect(() => {
        let active = true;

        const fetchDate = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!active) return;

            const rawDate = user?.user_metadata?.anniversary_date;
            if (rawDate) {
                const parsed = new Date(rawDate);
                if (!Number.isNaN(parsed.getTime())) {
                    setStartedAt(parsed);
                }
            }

            setLoading(false);
        };

        void fetchDate();

        return () => {
            active = false;
        };
    }, [supabase]);

    useEffect(() => {
        if (!startedAt) return;

        const interval = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(interval);
    }, [startedAt]);

    const pushFloatingReward = useCallback((label?: string) => {
        const tones: FloatingReward["tone"][] = ["gold", "pink", "mint"];
        const reward: FloatingReward = {
            id: rewardIdRef.current++,
            label: label ?? BONUS_REWARDS[Math.floor(Math.random() * BONUS_REWARDS.length)]!,
            x: Math.floor((Math.random() - 0.5) * 140),
            y: -40 - Math.floor(Math.random() * 70),
            tone: tones[Math.floor(Math.random() * tones.length)]!,
        };

        setFloatingRewards((current) => [...current, reward]);
    }, []);

    const removeFloatingReward = useCallback((id: number) => {
        setFloatingRewards((current) => current.filter((item) => item.id !== id));
    }, []);

    const launchWowEffects = useCallback(
        (combo: number) => {
            confetti({
                particleCount: 24,
                spread: 56,
                startVelocity: 28,
                scalar: 0.9,
                ticks: 120,
                origin: { x: 0.5, y: 0.78 },
                colors: ["#ff5ea8", "#ff8f67", "#ffd36c", "#ffffff"],
            });

            if (combo >= 6 && combo % 3 === 0) {
                confetti({
                    particleCount: 72,
                    spread: 95,
                    startVelocity: 42,
                    scalar: 1.05,
                    ticks: 180,
                    origin: { x: 0.5, y: 0.72 },
                    colors: ["#ff5ea8", "#ffd36c", "#ff8f67", "#fff2d0"],
                });
                pushFloatingReward("WOW! ✨");
            }

            if (combo >= 12 && combo % 6 === 0) {
                confetti({
                    particleCount: 64,
                    angle: 60,
                    spread: 70,
                    startVelocity: 46,
                    origin: { x: 0.15, y: 0.78 },
                    colors: ["#ff5ea8", "#ffd36c", "#ffffff"],
                });
                confetti({
                    particleCount: 64,
                    angle: 120,
                    spread: 70,
                    startVelocity: 46,
                    origin: { x: 0.85, y: 0.78 },
                    colors: ["#ff5ea8", "#ffd36c", "#ffffff"],
                });
                pushFloatingReward("ФЕЙЕРВЕРК! 🎆");
            }
        },
        [pushFloatingReward],
    );

    const triggerTapFlash = useCallback(() => {
        if (tapFlashTimeoutRef.current) {
            window.clearTimeout(tapFlashTimeoutRef.current);
        }
        setTapFlash(true);
        tapFlashTimeoutRef.current = window.setTimeout(() => {
            setTapFlash(false);
            tapFlashTimeoutRef.current = null;
        }, 160);
    }, []);

    const maybeUpgradeAutoLevel = useCallback(
        (nextScore: number) => {
            const currentLevel = autoLevelRef.current;
            if (currentLevel === 1 && nextScore >= 25) {
                autoLevelRef.current = 2;
                setAutoLevel(2);
                pushFloatingReward("Турбо x2");
                return;
            }
            if (currentLevel === 2 && nextScore >= 80) {
                autoLevelRef.current = 3;
                setAutoLevel(3);
                pushFloatingReward("Турбо x3");
            }
        },
        [pushFloatingReward],
    );

    const onHeartTap = useCallback(() => {
        const nowMs = Date.now();
        const nextCombo = nowMs - lastTapRef.current <= 1400 ? comboRef.current + 1 : 1;
        lastTapRef.current = nowMs;
        comboRef.current = nextCombo;
        const gain = nextCombo >= 14 ? 3 : nextCombo >= 7 ? 2 : 1;
        const nextScore = heartScoreRef.current + gain;
        heartScoreRef.current = nextScore;
        maybeUpgradeAutoLevel(nextScore);
        pushFloatingReward(`+${gain} ❤️`);

        if (Math.random() < 0.22) {
            pushFloatingReward();
        }

        launchWowEffects(nextCombo);
        triggerTapFlash();
    }, [launchWowEffects, maybeUpgradeAutoLevel, pushFloatingReward, triggerTapFlash]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (Date.now() - lastTapRef.current > 1700 && comboRef.current > 0) {
                comboRef.current = 0;
            }
        }, 450);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        autoLevelRef.current = autoLevel;
    }, [autoLevel]);

    useEffect(() => {
        if (!autoClickEnabled) return;

        const stepMs = Math.max(650, 1300 - autoLevelRef.current * 200);
        const interval = window.setInterval(() => {
            const nextScore = heartScoreRef.current + autoLevelRef.current;
            heartScoreRef.current = nextScore;
            maybeUpgradeAutoLevel(nextScore);
            autoTickRef.current += 1;

            if (autoTickRef.current % 3 === 0) {
                pushFloatingReward(`+${autoLevelRef.current} авто`);
            }
        }, stepMs);

        return () => window.clearInterval(interval);
    }, [autoClickEnabled, autoLevel, maybeUpgradeAutoLevel, pushFloatingReward]);

    useEffect(
        () => () => {
            if (tapFlashTimeoutRef.current) {
                window.clearTimeout(tapFlashTimeoutRef.current);
            }
        },
        [],
    );

    const timer = startedAt ? buildTimer(startedAt, now) : null;
    const journeyBgSrc = "/journey-bg.png";

    return (
        <main className="relative w-full min-h-[100dvh] overflow-hidden">
            <Image
                src={journeyBgSrc}
                alt="Наш путь фон"
                fill
                priority
                unoptimized
                className="object-cover object-center"
                sizes="100vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(22,7,30,0.14)_0%,rgba(24,8,24,0.07)_30%,rgba(16,7,17,0.42)_75%,rgba(10,5,11,0.6)_100%)]" />

            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[760px] flex-col items-center px-4 pt-8 pb-10 text-white">
                <BackButton href="/" className="absolute left-4 top-4 z-20" />

                <h1 className="journey-title mt-6 flex items-center gap-2 text-center leading-none">
                    <span className="journey-title-text">Наш Путь</span>
                    <span className="journey-title-emoji" aria-hidden>❤️🙌</span>
                </h1>

                <div className="mt-24 flex w-full flex-col items-center">
                    <p className="journey-subtitle whitespace-nowrap text-center uppercase">МЫ ВМЕСТЕ УЖЕ</p>

                    {loading ? (
                        <div className="mt-8 h-24 w-[90%] max-w-[620px] animate-pulse rounded-2xl bg-white/20" />
                    ) : !timer ? (
                        <Card className="mt-8 border-white/35 bg-black/22 px-5 py-4 text-center backdrop-blur-[2px]">
                            <p className="text-base font-bold">Укажи дату начала отношений в настройках.</p>
                            <Link
                                href="/settings"
                                className="touch-target mt-3 inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-white/45 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-wide"
                            >
                                Открыть настройки
                            </Link>
                        </Card>
                    ) : (
                        <div
                            className="mt-8 grid w-full max-w-[700px] grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-end gap-x-1 text-center"
                            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                        >
                            <div className="flex flex-col items-center">
                                <span className="timer-num text-[96px] leading-[0.84]">{timer.days}</span>
                                <span className="timer-unit mt-1 text-[40px]">ДН</span>
                            </div>
                            <span className="timer-colon pb-6 text-[70px]">:</span>

                            <div className="flex flex-col items-center">
                                <span className="timer-num text-[96px] leading-[0.84]">{pad2(timer.hours)}</span>
                                <span className="timer-unit mt-1 text-[40px]">Ч</span>
                            </div>
                            <span className="timer-colon pb-6 text-[70px]">:</span>

                            <div className="flex flex-col items-center">
                                <span className="timer-num text-[96px] leading-[0.84]">{pad2(timer.minutes)}</span>
                                <span className="timer-unit mt-1 text-[40px]">М</span>
                            </div>
                            <span className="timer-colon pb-6 text-[70px]">:</span>

                            <div className="flex flex-col items-center">
                                <span className="timer-num timer-sec text-[96px] leading-[0.84]">{pad2(timer.seconds)}</span>
                                <span className="timer-unit mt-1 text-[40px]">С</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="journey-heart-zone pointer-events-none absolute inset-x-0 z-20 flex justify-center">
                    <div className="pointer-events-auto relative flex flex-col items-center">
                        <div className="journey-reward-layer" aria-hidden>
                            {floatingRewards.map((reward) => (
                                <span
                                    key={reward.id}
                                    className={`journey-reward journey-reward--${reward.tone}`}
                                    style={
                                        {
                                            "--reward-x": `${reward.x}px`,
                                            "--reward-y": `${reward.y}px`,
                                        } as React.CSSProperties
                                    }
                                    onAnimationEnd={() => removeFloatingReward(reward.id)}
                                >
                                    {reward.label}
                                </span>
                            ))}
                        </div>

                        <button
                            type="button"
                            className={`journey-heart-btn${tapFlash ? " journey-heart-btn--tap" : ""}`}
                            onClick={onHeartTap}
                            aria-label="Антистресс сердце"
                        >
                            <span className="journey-heart select-none leading-none" aria-hidden>
                                <svg
                                    className="journey-heart-icon"
                                    viewBox="0 0 120 108"
                                    role="presentation"
                                    focusable="false"
                                >
                                    <defs>
                                        <linearGradient id="journey-heart-gradient" x1="16" y1="12" x2="98" y2="98">
                                            <stop offset="0%" stopColor="#ffd1ea" />
                                            <stop offset="44%" stopColor="#ff6fbb" />
                                            <stop offset="100%" stopColor="#ff3ea0" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M60 104C58.9 104 57.9 103.6 57.1 102.8C33.4 81.2 18 66.9 18 50.5C18 37.1 28.4 27 41.1 27C48.6 27 55.8 30.8 60 36.8C64.2 30.8 71.4 27 78.9 27C91.6 27 102 37.1 102 50.5C102 66.9 86.6 81.2 62.9 102.8C62.1 103.6 61.1 104 60 104Z"
                                        fill="url(#journey-heart-gradient)"
                                    />
                                    <path
                                        d="M60 42C56.4 36.7 49.9 33 43.6 33C33.4 33 25.5 41.3 25.5 51.6C25.5 64.1 37.5 75.3 59.5 95.3C59.7 95.5 59.9 95.6 60 95.6V42Z"
                                        fill="#ffd9ee"
                                        opacity="0.32"
                                    />
                                </svg>
                            </span>
                        </button>

                    </div>
                </div>
            </div>

            <style jsx>{`
                .journey-title {
                    font-size: 41px;
                    font-weight: 800;
                    letter-spacing: -0.008em;
                    text-shadow: 0 3px 10px rgba(0, 0, 0, 0.52);
                }

                .journey-title-text {
                    color: rgba(255, 247, 236, 0.84);
                }

                .journey-title-emoji {
                    font-size: 0.72em;
                    line-height: 1;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                    opacity: 0.88;
                }

                .journey-subtitle {
                    font-size: 33px;
                    font-weight: 700;
                    letter-spacing: 0.11em;
                    color: rgba(255, 245, 229, 0.68);
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.42);
                }

                .timer-num {
                    color: rgba(255, 245, 228, 0.84);
                    font-weight: 800;
                    letter-spacing: -0.016em;
                    text-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
                }

                .timer-sec {
                    color: #e38849;
                    text-shadow:
                        0 3px 10px rgba(0, 0, 0, 0.5),
                        0 0 10px rgba(227, 136, 73, 0.26);
                }

                .timer-unit {
                    color: rgba(255, 236, 212, 0.74);
                    font-weight: 700;
                    letter-spacing: 0.14em;
                    text-shadow: 0 2px 7px rgba(0, 0, 0, 0.43);
                }

                .timer-colon {
                    color: rgba(246, 194, 100, 0.68);
                    font-weight: 800;
                    text-shadow: 0 0 8px rgba(246, 194, 100, 0.3);
                }

                .journey-heart {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    filter:
                        drop-shadow(0 0 18px rgba(255, 178, 209, 0.82))
                        drop-shadow(0 0 34px rgba(255, 116, 173, 0.78))
                        drop-shadow(0 0 58px rgba(255, 96, 150, 0.42));
                    animation: heartPulse 2.4s ease-in-out infinite;
                }

                .journey-heart-icon {
                    width: 170px;
                    height: auto;
                    display: block;
                }

                .journey-heart-zone {
                    bottom: clamp(200px, calc(28vh + env(safe-area-inset-bottom, 0px)), 280px);
                }

                .journey-heart-btn {
                    border: 0;
                    background: transparent;
                    line-height: 1;
                    cursor: pointer;
                    transition: transform 0.12s ease;
                }

                .journey-heart-btn:active {
                    transform: scale(1.08);
                }

                .journey-heart-btn--tap {
                    transform: scale(1.12);
                }

                .journey-reward-layer {
                    pointer-events: none;
                    position: absolute;
                    top: -80px;
                    left: 50%;
                    width: 340px;
                    height: 210px;
                    transform: translateX(-50%);
                }

                .journey-reward {
                    position: absolute;
                    left: 50%;
                    top: 70%;
                    font-size: 20px;
                    font-weight: 900;
                    letter-spacing: 0.01em;
                    transform: translate(-50%, 0);
                    animation: rewardRise 1.25s ease-out forwards;
                    text-shadow: 0 5px 12px rgba(0, 0, 0, 0.5);
                    white-space: nowrap;
                }

                .journey-reward--gold {
                    color: #ffe39c;
                }

                .journey-reward--pink {
                    color: #ffd0e7;
                }

                .journey-reward--mint {
                    color: #c6ffe8;
                }

                @keyframes rewardRise {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, 0);
                    }
                    15% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translate(calc(-50% + var(--reward-x)), var(--reward-y));
                    }
                }

                @keyframes heartPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }

                @media (max-width: 920px) {
                    .journey-title {
                        font-size: 37px;
                    }

                    .journey-subtitle {
                        font-size: 29px;
                        letter-spacing: 0.09em;
                    }

                    .timer-num {
                        font-size: 84px !important;
                    }

                    .timer-unit {
                        font-size: 34px !important;
                    }

                    .timer-colon {
                        font-size: 62px !important;
                    }
                }

                @media (max-width: 640px) {
                    .journey-title {
                        margin-top: 18px;
                        font-size: 33px;
                    }

                    .journey-subtitle {
                        font-size: 25px;
                        letter-spacing: 0.07em;
                    }

                    .timer-num {
                        font-size: 50px !important;
                    }

                    .timer-unit {
                        margin-top: 2px;
                        font-size: 18px !important;
                        letter-spacing: 0.07em;
                    }

                    .timer-colon {
                        padding-bottom: 14px;
                        font-size: 37px !important;
                    }

                    .journey-heart {
                        font-size: initial;
                    }

                    .journey-heart-icon {
                        width: 128px;
                    }

                    .journey-heart-zone {
                        bottom: clamp(170px, calc(24vh + env(safe-area-inset-bottom, 0px)), 240px);
                    }

                    .journey-reward-layer {
                        width: 300px;
                    }

                    .journey-reward {
                        font-size: 16px;
                    }
                }

                @media (max-width: 430px) {
                    .journey-title {
                        font-size: 30px;
                    }

                    .journey-subtitle {
                        font-size: 22px;
                        letter-spacing: 0.05em;
                    }

                    .timer-num {
                        font-size: 43px !important;
                    }

                    .timer-unit {
                        font-size: 15px !important;
                        letter-spacing: 0.05em;
                    }

                    .timer-colon {
                        font-size: 31px !important;
                        padding-bottom: 10px;
                    }

                    .journey-heart-zone {
                        bottom: clamp(150px, calc(22vh + env(safe-area-inset-bottom, 0px)), 210px);
                    }

                    .journey-heart-icon {
                        width: 120px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .journey-heart {
                        animation: none;
                    }

                    .journey-reward {
                        animation-duration: 0.8s;
                    }
                }
            `}</style>
        </main>
    );
}
