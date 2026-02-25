"use client";

import React, { useState } from 'react';
import { hapticFeedback } from '@/lib/utils/haptics';
import confetti from 'canvas-confetti';
import BackButton from '@/components/BackButton';

/* ─── Data ─────────────────────────────────────────────────────────────── */

const TRUTH_QUESTIONS = [
    "Что тебе больше всего нравится в нашем партнёрстве?",
    "Какой момент в наших отношениях ты вспоминаешь с наибольшей теплотой?",
    "Чего ты никогда не делал и хочет попробовать вместе со мной?",
    "Какова твоя самая заветная мечта для нас двоих?",
    "Что я делаю, что тебя тайно восхищает?",
    "Что тебя больше всего в жизни пугает и почему?",
    "Опиши свой идеальный день с партнёром — от утра до ночи.",
    "Какая черта моего характера тебе нравится больше всего?",
    "Где ты мечтаешь побывать со мной и почему именно там?",
    "Чего тебе не хватает в наших отношениях прямо сейчас?",
    "Какой у тебя самый стёртый секрет, который ты никогда не рассказывал?",
    "Как ты понял что влюбился в меня?",
    "Что тебя приятно удивило в нашем союзе?",
    "Если бы мы поменялись ролями на один день — что бы ты сделал?",
    "Какое самое романтическое, что я когда-либо делал для тебя?",
];

const DARE_CHALLENGES = [
    "Напой любимую песню партнёра с выражением.",
    "Напиши партнёру комплимент из 20 слов, не повторяя ни одного прилагательного дважды.",
    "Изобрази жестами три наших совместных воспоминания — партнёр угадывает.",
    "Сделай партнёру трёхминутный массаж плеч.",
    "Придумай и расскажи смешную историю, в которой мы главные герои.",
    "Спой серенаду партнёру из любых трёх строчек.",
    "Нарисуй партнёра с закрытыми глазами за 30 секунд.",
    "Скажи три вещи, которые ты никогда не говорил вслух, но думал.",
    "Повтори последнее, что сказал партнёр, максимально смешным голосом.",
    "Придумай для нас двоих прозвище-команду и объясни почему.",
    "Отправь маме сообщение: «Привет, у меня всё хорошо!» прямо сейчас.",
    "Расскажи партнёру, какую суперсилу ты бы выбрал для нашей пары — и зачем.",
    "Покажи партнёру три фото из телефона наугад и расскажи историю каждого.",
    "Станцуй 20 секунд под любую песню без музыки — только в голове.",
    "Угадай, о чём думает партнёр прямо сейчас. Одна попытка.",
];

const WOULD_YOU_RATHER = [
    ["Жить год без музыки", "Жить год без сериалов"],
    ["Видеть будущее на 5 минут вперёд", "Изменить любое прошлое событие"],
    ["Путешествовать 3 месяца без телефона", "Год дома с любым комфортом"],
    ["Съесть одно любимое блюдо до конца жизни", "Питаться разнообразно, но без любимого"],
    ["Знать, что думает партнёр в любой момент", "Он/она знает что думаешь ты"],
    ["Первым признаться в любви", "Никогда не признаваться и ждать"],
    ["Бесконечные деньги, но нет времени", "Бесконечное время, но нет денег"],
    ["Вечная молодость, но один", "Стареть вместе с партнёром"],
    ["Помнить каждый сон в деталях", "Забывать сны сразу после пробуждения"],
    ["Жить в большом шумном городе", "Жить в тихой деревне у моря"],
];

const DISCUSS_TOPICS = [
    "Если бы у нас был год без работы и денег в достатке — что бы мы делали?",
    "Какие традиции хотим создать в своей семье?",
    "В чём мы похожи больше всего — и не замечаем этого?",
    "Как мы представляем свою жизнь через 10 лет?",
    "Что для нас значит «счастливые отношения» — конкретно, в деталях?",
    "Какие ценности мы хотим передать нашим детям?",
    "Что бы мы хотели изменить в нашем быту прямо сейчас?",
    "Какое наше совместное достижение нас гордит больше всего?",
    "Что нас объединяет, кроме любви?",
    "Если бы мы писали книгу о наших отношениях — как бы она называлась и чему была бы посвящена?",
];

const HOT_QUESTIONS = [
    "Что именно в моей внешности привлекает тебя больше всего?",
    "Какой поцелуй ты запомнил больше всего — и за что?",
    "Опиши своими словами идеальный романтический вечер со мной.",
    "Что ты думаешь, глядя на меня, но никогда не говоришь вслух?",
    "Какое прикосновение с моей стороны тебе нравится больше всего?",
    "Если бы мы были наедине без планов на весь день — чем бы ты хотел заняться?",
    "Что меня делает особенным(ой) в твоих глазах — физически?",
    "Как ты понимаешь, что я тебя хочу?",
    "Что было самым горячим моментом между нами?",
    "Какой комплимент от меня тебя разжигает сильнее всего?",
    "Что ты хочешь, чтобы я делал(а) чаще?",
    "Если бы я мог(ла) прочитать твои мысли прямо сейчас — что бы я увидел(а)?",
    "Какое место на моём теле тебе больше всего нравится?",
    "Что ты чувствуешь, когда я тебя обнимаю?",
];

const HOT_DARES = [
    "Смотри партнёру в глаза 60 секунд не отвлекаясь и не смеясь.",
    "Скажи партнёру три самых горячих комплимента, которые можешь придумать.",
    "Сделай партнёру медленный массаж шеи и плеч — 5 минут.",
    "Напиши партнёру голосовое сообщение с любовным признанием.",
    "Поцелуй партнёра в шею ровно 10 секунд.",
    "Шёпотом скажи партнёру, что ты о нём думаешь прямо сейчас.",
    "Погладь руку партнёра и расскажи что чувствуешь при прикосновении.",
    "Придумай партнёру пикантное прозвище и объясни почему.",
    "Закрой глаза, партнёр касается твоей руки — угадай каждое прикосновение.",
    "Напиши партнёру одно желание, которое хочешь исполнить вместе.",
    "Обними партнёра сзади и держи так 30 секунд молча.",
    "Скажи партнёру одну вещь, которую ты стесняешься говорить вслух.",
];

type SpicyGameMode = 'truth' | 'dare' | 'rather' | 'discuss' | 'hot' | 'hot-dare';

function CardGame({
    title,
    emoji,
    color,
    initialItems,
    renderItem,
    onBack,
    aiMode,
}: {
    title: string;
    emoji: string;
    color: string;
    initialItems: any[];
    renderItem: (item: any, i: number) => React.ReactNode;
    onBack: () => void;
    aiMode: SpicyGameMode;
}) {
    const [items, setItems] = useState<any[]>(initialItems);
    const [index, setIndex] = useState(0);
    const [done, setDone] = useState<number[]>([]);
    const [finished, setFinished] = useState(false);
    const [generating, setGenerating] = useState(false);

    const current = items[index];
    const remaining = items.map((_, i) => i).filter(i => !done.includes(i) && i !== index);

    const next = () => {
        hapticFeedback.medium();
        if (remaining.length === 0) {
            // All done — show AI generation screen
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            setFinished(true);
        } else {
            const nextIdx = remaining[Math.floor(Math.random() * remaining.length)];
            setDone(prev => [...prev, index]);
            setIndex(nextIdx);
        }
    };

    const loadAI = async () => {
        setGenerating(true);
        hapticFeedback.medium();
        try {
            const res = await fetch('/api/spicy-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: aiMode, count: 10 }),
            });
            const data = await res.json();
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                const startIdx = items.length;
                setItems(prev => [...prev, ...data.items]);
                setDone([]);
                setIndex(startIdx);
                setFinished(false);
                hapticFeedback.success();
            }
        } catch {
            // fallback: just restart with original items
            setDone([]);
            setIndex(0);
            setFinished(false);
        } finally {
            setGenerating(false);
        }
    };

    const restart = () => {
        setDone([]);
        setIndex(0);
        setFinished(false);
        hapticFeedback.light();
    };

    return (
        <div className="min-h-[100dvh] flex flex-col items-center px-5 pt-10 pb-28" style={{ background: 'var(--bg)' }}>
            <header className="w-full flex items-center gap-3 mb-8">
                <BackButton onClick={onBack} />
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>{emoji} {title}</h1>
                <span className="ml-auto text-xs font-bold opacity-40" style={{ color: 'var(--text)' }}>
                    {done.length + 1}/{items.length}
                </span>
            </header>

            {/* Progress bar */}
            <div className="w-full max-w-sm h-1.5 rounded-full mb-6" style={{ background: 'var(--bg-muted)' }}>
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${((done.length + 1) / items.length) * 100}%`, background: color }}
                />
            </div>

            {/* Card */}
            <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center gap-6">
                {finished ? (
                    /* ── All done screen ── */
                    <div className="flex flex-col items-center gap-6 text-center w-full">
                        <span className="text-6xl animate-bounce">🎉</span>
                        <div>
                            <p className="text-xl font-extrabold mb-1" style={{ color: 'var(--text)' }}>
                                Всё прошли!
                            </p>
                            <p className="text-sm opacity-50 font-medium" style={{ color: 'var(--text)' }}>
                                {done.length + 1} карточек позади
                            </p>
                        </div>

                        {/* AI generate button */}
                        <button
                            onClick={loadAI}
                            disabled={generating}
                            className="w-full max-w-sm py-4 rounded-2xl font-extrabold text-white text-base active:scale-95 transition-all shadow-lg relative overflow-hidden"
                            style={{
                                background: generating
                                    ? '#aaa'
                                    : `linear-gradient(135deg, ${color}, ${color}cc)`,
                                boxShadow: generating ? 'none' : `0 0 24px ${color}66`,
                            }}
                        >
                            {generating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin">⚙️</span> Генерирую...
                                </span>
                            ) : (
                                '✨ Сгенерировать ещё (AI)'
                            )}
                        </button>

                        <button
                            onClick={restart}
                            className="text-sm font-bold opacity-40 hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--text)' }}
                        >
                            🔄 Начать заново
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className="w-full rounded-[28px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col items-center gap-5 text-center min-h-[220px] justify-center"
                            style={{ background: 'var(--bg-card)', border: `2px solid ${color}22` }}
                        >
                            <span className="text-5xl">{emoji}</span>
                            {renderItem(current, index)}
                        </div>

                        <button
                            onClick={next}
                            className="w-full max-w-sm py-4 rounded-2xl font-extrabold text-white text-base active:scale-95 transition-all shadow-lg"
                            style={{ background: color }}
                        >
                            {remaining.length === 0 ? '🏁 Закончить' : 'Следующий →'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function SpicyPage() {
    const [mode, setMode] = useState<'home' | 'truth' | 'dare' | 'rather' | 'discuss' | 'hot' | 'hot-dare'>('home');
    const [ratherChoice, setRatherChoice] = useState<0 | 1 | null>(null);

    if (mode === 'truth') {
        return (
            <CardGame
                title="Правда"
                emoji="💬"
                color="#8b5cf6"
                initialItems={TRUTH_QUESTIONS}
                aiMode="truth"
                renderItem={(q) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>{q}</p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    if (mode === 'dare') {
        return (
            <CardGame
                title="Действие"
                emoji="🎯"
                color="#e07a5f"
                initialItems={DARE_CHALLENGES}
                aiMode="dare"
                renderItem={(c) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>{c}</p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    if (mode === 'rather') {
        return (
            <CardGame
                title="Что лучше?"
                emoji="⚡"
                color="#f59e0b"
                initialItems={WOULD_YOU_RATHER}
                aiMode="rather"
                renderItem={([a, b]: [string, string]) => (
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => { hapticFeedback.light(); setRatherChoice(0); }}
                            className={`w-full p-4 rounded-2xl font-bold text-base transition-all active:scale-95 ${ratherChoice === 0 ? 'text-white shadow-md' : 'opacity-80'}`}
                            style={{
                                background: ratherChoice === 0 ? '#f59e0b' : 'var(--bg-muted)',
                                color: ratherChoice === 0 ? 'white' : 'var(--text)',
                            }}
                        >
                            {a}
                        </button>
                        <div className="text-sm font-black opacity-30" style={{ color: 'var(--text)' }}>ИЛИ</div>
                        <button
                            onClick={() => { hapticFeedback.light(); setRatherChoice(1); }}
                            className={`w-full p-4 rounded-2xl font-bold text-base transition-all active:scale-95`}
                            style={{
                                background: ratherChoice === 1 ? '#f59e0b' : 'var(--bg-muted)',
                                color: ratherChoice === 1 ? 'white' : 'var(--text)',
                            }}
                        >
                            {b}
                        </button>
                    </div>
                )}
                onBack={() => { setMode('home'); setRatherChoice(null); }}
            />
        );
    }

    if (mode === 'discuss') {
        return (
            <CardGame
                title="Поговорим"
                emoji="🫂"
                color="#10b981"
                initialItems={DISCUSS_TOPICS}
                aiMode="discuss"
                renderItem={(t) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>{t}</p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    if (mode === 'hot') {
        return (
            <CardGame
                title="Горячие вопросы"
                emoji="🌶️"
                color="#ec4899"
                initialItems={HOT_QUESTIONS}
                aiMode="hot"
                renderItem={(q) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>{q}</p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    if (mode === 'hot-dare') {
        return (
            <CardGame
                title="Горячие задания"
                emoji="💋"
                color="#f43f5e"
                initialItems={HOT_DARES}
                aiMode="hot-dare"
                renderItem={(c) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>{c}</p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    /* ── Home ── */
    return (
        <main className="w-full min-h-[100dvh] flex flex-col items-center px-6 pt-12 pb-32" style={{ background: 'var(--bg)' }}>
            <header className="w-full flex justify-between items-center mb-2">
                <BackButton href="/" />
                <div className="w-8" />
            </header>

            {/* Hero */}
            <div className="flex flex-col items-center gap-2 mb-10 text-center">
                <span className="text-6xl drop-shadow-md">🔥</span>
                <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Для двоих</h1>
                <p className="text-sm opacity-50 font-bold max-w-[240px]" style={{ color: 'var(--text)' }}>
                    Игры, вопросы и темы для настоящего вечера вдвоём
                </p>
            </div>

            {/* Game cards */}
            <div className="w-full max-w-sm flex flex-col gap-3">

                {/* Truth */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('truth'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(139,92,246,0.15)]"
                    style={{ background: '#f5f0ff', border: '2px solid #8b5cf622' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: '#8b5cf6' }}>💬</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#4c1d95' }}>Правда</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#4c1d95' }}>
                            {TRUTH_QUESTIONS.length} вопросов о вас обоих
                        </p>
                    </div>
                    <span className="text-xl opacity-30">›</span>
                </button>

                {/* Dare */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('dare'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(224,122,95,0.15)]"
                    style={{ background: '#fff4f0', border: '2px solid #e07a5f22' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: '#e07a5f' }}>🎯</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#7c2d12' }}>Действие</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#7c2d12' }}>
                            {DARE_CHALLENGES.length} заданий для смелых
                        </p>
                    </div>
                    <span className="text-xl opacity-30">›</span>
                </button>

                {/* Would you rather */}
                <button
                    onClick={() => { hapticFeedback.medium(); setRatherChoice(null); setMode('rather'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                    style={{ background: '#fffbeb', border: '2px solid #f59e0b22' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: '#f59e0b' }}>⚡</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#78350f' }}>Что лучше?</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#78350f' }}>
                            {WOULD_YOU_RATHER.length} дилемм — выбери и объясни
                        </p>
                    </div>
                    <span className="text-xl opacity-30">›</span>
                </button>

                {/* Deep talks */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('discuss'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                    style={{ background: '#f0fdf9', border: '2px solid #10b98122' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: '#10b981' }}>🫂</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#065f46' }}>Поговорим</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#065f46' }}>
                            {DISCUSS_TOPICS.length} глубоких тем для разговора
                        </p>
                    </div>
                    <span className="text-xl opacity-30">›</span>
                </button>

                {/* Hot questions */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('hot'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(236,72,153,0.2)]"
                    style={{ background: 'linear-gradient(135deg, #fdf2f8, #fff0f5)', border: '2px solid #ec489922' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>🌶️</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#831843' }}>Горячие вопросы</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#831843' }}>
                            {HOT_QUESTIONS.length} интимных вопросов для двоих 🔥
                        </p>
                    </div>
                    <span className="text-xl opacity-30">›</span>
                </button>

                {/* Hot dares */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('hot-dare'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(244,63,94,0.2)]"
                    style={{ background: 'linear-gradient(135deg, #fff1f2, #fce7f3)', border: '2px solid #f43f5e22' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)' }}>💋</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#881337' }}>Горячие задания</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#881337' }}>
                            {HOT_DARES.length} чувственных заданий
                        </p>
                    </div>
                    <span className="text-xl opacity-30">›</span>
                </button>

            </div>

            <p className="mt-8 text-xs opacity-30 text-center font-bold" style={{ color: 'var(--text)' }}>
                Только для двоих 🔐
            </p>
        </main>
    );
}
