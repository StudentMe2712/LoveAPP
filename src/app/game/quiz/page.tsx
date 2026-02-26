"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { hapticFeedback } from '@/lib/utils/haptics';
import { generateQuizQuestionsAction } from '@/app/actions/quiz';
import confetti from 'canvas-confetti';
import { useResolvedPartnerName } from '@/lib/hooks/useResolvedPartnerName';
import BackButton from '@/components/BackButton';
import StateBlock from '@/components/ui/StateBlock';

type Question = {
    id: string;
    author_id: string;
    question_text: string;
    correct_answer: string;
    created_at: string;
};

type Answer = {
    id: string;
    question_id: string;
    answerer_id: string;
    answer_text: string;
    is_correct: boolean | null;
};

function normalize(s: string) {
    return s.trim().toLowerCase().replace(/ё/g, 'е');
}

type AISuggestion = { question: string; hint?: string };

function textFromUnknown(value: unknown): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (value && typeof value === 'object') {
        const values = Object.values(value as Record<string, unknown>);
        const firstString = values.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
        return typeof firstString === 'string' ? firstString.trim() : null;
    }
    return null;
}

function normalizeAISuggestions(raw: unknown): AISuggestion[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item): AISuggestion | null => {
            if (typeof item === 'string') {
                const question = item.trim();
                return question ? { question } : null;
            }
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const values = Object.values(record);
            const question =
                textFromUnknown(record.question) ??
                textFromUnknown(record.prompt) ??
                textFromUnknown(record.text) ??
                textFromUnknown(record.title) ??
                textFromUnknown(values[0]);
            if (!question) return null;
            const hint =
                textFromUnknown(record.hint) ??
                textFromUnknown(record.clue) ??
                textFromUnknown(record.tip) ??
                textFromUnknown(values[1]);
            return hint && hint !== question ? { question, hint } : { question };
        })
        .filter((item): item is AISuggestion => item !== null);
}

export default function QuizPage() {
    const [tab, setTab] = useState<'write' | 'answer' | 'results'>('write');
    const [myQuestions, setMyQuestions] = useState<Question[]>([]);
    const [partnerQuestions, setPartnerQuestions] = useState<Question[]>([]);

    // myAnswers = answers I gave to partner's questions
    const [myAnswers, setMyAnswers] = useState<Record<string, Answer>>({});
    // partnerAnswers = answers partner gave to my questions
    const [partnerAnswers, setPartnerAnswers] = useState<Record<string, Answer>>({});

    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [pairId, setPairId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Per-question state in Answer tab
    const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
    // "revealed" = user clicked "Show answer" after wrong guess
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});

    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<{ question: string; hint?: string }[]>([]);
    const resolvedPartnerName = useResolvedPartnerName();

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            ),
        [],
    );

    const fetchData = useCallback(async (uid: string, pid: string, partnerId: string) => {
        const [{ data: mine }, { data: theirs }, { data: myAns }, { data: partnerAns }] =
            await Promise.all([
                supabase.from('quiz_questions').select('*').eq('pair_id', pid).eq('author_id', uid).order('created_at', { ascending: true }),
                supabase.from('quiz_questions').select('*').eq('pair_id', pid).eq('author_id', partnerId).order('created_at', { ascending: true }),
                supabase.from('quiz_answers').select('*').eq('answerer_id', uid),
                supabase.from('quiz_answers').select('*').eq('answerer_id', partnerId),
            ]);

        setMyQuestions(mine || []);
        setPartnerQuestions(theirs || []);

        const myMap: Record<string, Answer> = {};
        (myAns || []).forEach(a => { myMap[a.question_id] = a; });
        setMyAnswers(myMap);

        const partnerMap: Record<string, Answer> = {};
        (partnerAns || []).forEach(a => { partnerMap[a.question_id] = a; });
        setPartnerAnswers(partnerMap);
    }, [supabase]);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            setUserId(user.id);

            const { data: pair } = await supabase
                .from('pair')
                .select('id, user1_id, user2_id')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .single();

            if (pair) {
                setPairId(pair.id);
                const partnerId = pair.user1_id === user.id ? pair.user2_id : pair.user1_id;
                await fetchData(user.id, pair.id, partnerId);
            }
            setLoading(false);
        };
        void init();
    }, [fetchData, supabase]);

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim() || !newAnswer.trim() || !userId || !pairId) return;

        const { error } = await supabase.from('quiz_questions').insert({
            pair_id: pairId,
            author_id: userId,
            question_text: newQuestion.trim(),
            correct_answer: newAnswer.trim(),
        });

        if (error) { toast.error('Ошибка при добавлении вопроса'); return; }

        toast.success('Вопрос добавлен! 🤫');
        hapticFeedback.success();
        setNewQuestion(''); setNewAnswer('');

        const { data: mine } = await supabase.from('quiz_questions').select('*')
            .eq('pair_id', pairId).eq('author_id', userId).order('created_at', { ascending: true });
        setMyQuestions(mine || []);
    };

    const handleGenerateAI = async () => {
        setAiLoading(true);
        hapticFeedback.medium();
        toast.loading('AI генерирует вопросы...', { id: 'ai-gen' });
        try {
            const res = await generateQuizQuestionsAction();
            const suggestions = normalizeAISuggestions(res.data);
            if (suggestions.length > 0) {
                setAiSuggestions(suggestions);
                toast.success(`Готово! ${suggestions.length} вопросов 🤖`, { id: 'ai-gen' });
                hapticFeedback.success();
            } else {
                toast.error('Не удалось сгенерировать', { id: 'ai-gen' });
            }
        } catch {
            toast.error('Ошибка AI', { id: 'ai-gen' });
        } finally {
            setAiLoading(false);
        }
    };

    const handleUseAISuggestion = (s: { question: string; hint?: string }) => {
        setNewQuestion(s.question); setNewAnswer('');
        setAiSuggestions(prev => prev.filter(x => x.question !== s.question));
        hapticFeedback.light();
        document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Submit an answer for a given question
    const handleSubmitAnswer = async (q: Question) => {
        const input = (answerInputs[q.id] || '').trim();
        if (!input || !userId) return;
        if (submitting[q.id]) return;

        setSubmitting(prev => ({ ...prev, [q.id]: true }));

        const isCorrect = normalize(input) === normalize(q.correct_answer);

        const { data, error } = await supabase.from('quiz_answers').insert({
            question_id: q.id,
            answerer_id: userId,
            answer_text: input,
            is_correct: isCorrect,
        }).select().single();

        setSubmitting(prev => ({ ...prev, [q.id]: false }));

        if (error) { toast.error('Ошибка при сохранении'); return; }

        const newAns: Answer = data || { id: '', question_id: q.id, answerer_id: userId, answer_text: input, is_correct: isCorrect };
        setMyAnswers(prev => ({ ...prev, [q.id]: newAns }));

        if (isCorrect) {
            hapticFeedback.success();
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } else {
            hapticFeedback.medium();
        }
    };

    const handleReveal = (qId: string) => {
        setRevealed(prev => ({ ...prev, [qId]: true }));
        hapticFeedback.light();
    };

    const unanswered = partnerQuestions.filter(q => !myAnswers[q.id]);
    const correctCount = partnerQuestions.filter(q => myAnswers[q.id]?.is_correct === true).length;
    const tabs: Array<{ id: 'write' | 'answer' | 'results'; label: string }> = [
        { id: 'write', label: '✍️ Мои вопросы' },
        { id: 'answer', label: `💬 Ответить${unanswered.length > 0 ? ` (${unanswered.length})` : ''}` },
        { id: 'results', label: '📊 Итоги' },
    ];

    if (loading) return (
        <main className="app-safe-top app-safe-bottom w-full min-h-[100dvh] px-6">
            <StateBlock icon="💭" title="Загружаем квиз..." className="mt-12" />
        </main>
    );

    return (
        <main className="app-safe-top app-safe-bottom w-full min-h-[100dvh] flex flex-col items-center px-6">
            <header className="w-full flex justify-between items-center mb-6">
                <BackButton href="/game" />
                <h1 className="text-xl font-extrabold tracking-tight">Как ты меня знаешь? 💭</h1>
                <div className="w-8" />
            </header>

            {/* Tabs */}
            <div className="flex bg-[#e8dfd5] dark:bg-[#3d332c] p-1.5 rounded-[20px] mb-6 w-full gap-1 shadow-inner">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => { hapticFeedback.light(); setTab(t.id); }}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${tab === t.id ? 'bg-white dark:bg-[#2d2621] shadow-sm text-[#cca573]' : 'opacity-60 hover:opacity-100'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Write Tab ── */}
            {tab === 'write' && (
                <div className="w-full flex flex-col gap-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">🤫 {resolvedPartnerName} видит вопросы, но не видит правильные ответы!</p>
                    </div>

                    <form onSubmit={handleAddQuestion} className="flex flex-col gap-3 bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-5 border border-[#e8dfd5] dark:border-[#3d332c]">
                        <h3 className="font-extrabold text-lg text-[#4a403b] dark:text-[#d4c8c1]">Добавить вопрос</h3>
                        <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)}
                            placeholder="Вопрос (напр: Какой мой любимый цвет?)"
                            className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#55331a] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none text-sm" required />
                        <input value={newAnswer} onChange={e => setNewAnswer(e.target.value)}
                            placeholder="Правильный ответ (только ты видишь)"
                            className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#55331a] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none text-sm" required />
                        <button type="submit" className="w-full py-3 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold active:scale-95 transition-all">
                            + Добавить вопрос
                        </button>
                    </form>

                    {/* AI Suggestions */}
                    <button onClick={handleGenerateAI} disabled={aiLoading}
                        className="w-full py-3.5 rounded-2xl font-bold border-2 border-dashed border-[#cca573]/60 text-[#cca573] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                        <span className={aiLoading ? 'animate-spin' : ''}>🤖</span>
                        {aiLoading ? 'Генерирую...' : 'Сгенерировать вопросы с AI'}
                    </button>

                    {aiSuggestions.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h3 className="font-bold text-xs uppercase tracking-wider opacity-50 px-1 text-[#4a403b] dark:text-[#d4c8c1]">Идеи от AI — нажми чтобы использовать</h3>
                            {aiSuggestions.map((s, i) => (
                                <button key={i} onClick={() => handleUseAISuggestion(s)}
                                    className="w-full text-left bg-[#fdfbf9] dark:bg-[#2c2623] rounded-2xl p-4 border-2 border-[#cca573]/30 hover:border-[#cca573] active:scale-95 transition-all">
                                    <p className="font-bold text-sm text-[#4a403b] dark:text-[#d4c8c1]">{s.question}</p>
                                    {s.hint && <p className="text-xs opacity-40 mt-0.5 italic">{s.hint}</p>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* My questions list — color-coded by partner's answer status */}
                    {myQuestions.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h3 className="font-bold text-xs uppercase tracking-wider opacity-50 px-1 text-[#4a403b] dark:text-[#d4c8c1]">
                                Твои вопросы ({myQuestions.length})
                            </h3>
                            {myQuestions.map((q, i) => {
                                const partnerAns = partnerAnswers[q.id];
                                const status = !partnerAns ? 'pending' : partnerAns.is_correct ? 'correct' : 'wrong';
                                return (
                                    <div key={q.id} className={`rounded-2xl p-4 border-2 transition-all ${status === 'correct'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/50'
                                            : status === 'wrong'
                                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700/50'
                                                : 'bg-[#fdfbf9] dark:bg-[#2c2623] border-[#e8dfd5] dark:border-[#3d332c]'
                                        }`}>
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg shrink-0 mt-0.5">
                                                {status === 'correct' ? '✅' : status === 'wrong' ? '❌' : '⏳'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold text-sm leading-snug ${status === 'correct' ? 'text-emerald-800 dark:text-emerald-200'
                                                        : status === 'wrong' ? 'text-red-800 dark:text-red-200'
                                                            : 'text-[#4a403b] dark:text-[#d4c8c1]'
                                                    }`}>
                                                    {i + 1}. {q.question_text}
                                                </p>
                                                <p className="text-xs mt-1 opacity-60">
                                                    Ответ: <span className="font-bold">{q.correct_answer}</span>
                                                </p>
                                                {partnerAns && (
                                                    <p className={`text-xs mt-0.5 font-medium ${partnerAns.is_correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                                                        }`}>
                                                        {resolvedPartnerName} ответил(а): «{partnerAns.answer_text}»
                                                    </p>
                                                )}
                                                {!partnerAns && (
                                                    <p className="text-xs mt-0.5 opacity-40 italic">{resolvedPartnerName} ещё не ответил(а)</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Answer Tab ── */}
            {tab === 'answer' && (
                <div className="w-full flex flex-col gap-4">
                    {partnerQuestions.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 mt-10 text-center">
                            <span className="text-5xl">🙈</span>
                            <p className="font-bold text-[#4a403b] dark:text-[#d4c8c1]">{resolvedPartnerName} ещё не добавил(а) вопросы!</p>
                            <p className="text-sm opacity-50">Пусть перейдет на вкладку «Мои вопросы» и добавит несколько.</p>
                        </div>
                    ) : (
                        partnerQuestions.map((q, i) => {
                            const myAns = myAnswers[q.id];
                            const isRev = revealed[q.id];

                            return (
                                <div key={q.id} className={`rounded-3xl p-5 border-2 flex flex-col gap-3 transition-all ${myAns?.is_correct
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600/40'
                                        : myAns && !myAns.is_correct
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600/40'
                                            : 'bg-[#fdfbf9] dark:bg-[#2c2623] border-[#e8dfd5] dark:border-[#3d332c]'
                                    }`}>
                                    <p className="font-extrabold text-base text-[#4a403b] dark:text-[#d4c8c1] leading-snug">
                                        {i + 1}. {q.question_text}
                                    </p>

                                    {/* Not yet answered */}
                                    {!myAns && (
                                        <>
                                            <input
                                                value={answerInputs[q.id] || ''}
                                                onChange={e => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                placeholder="Твой ответ..."
                                                className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#55331a] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none text-sm"
                                                onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer(q)}
                                            />
                                            <button
                                                onClick={() => handleSubmitAnswer(q)}
                                                disabled={submitting[q.id] || !answerInputs[q.id]?.trim()}
                                                className="w-full py-3 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-40"
                                            >
                                                {submitting[q.id] ? '...' : 'Ответить →'}
                                            </button>
                                        </>
                                    )}

                                    {/* Correct answer */}
                                    {myAns?.is_correct && (
                                        <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-800/30 rounded-2xl px-4 py-3">
                                            <span className="text-2xl">🎉</span>
                                            <div>
                                                <p className="font-black text-emerald-700 dark:text-emerald-300">Ответ правильный!</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">Твой ответ: «{myAns.answer_text}»</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Wrong answer — show what was entered, then reveal button */}
                                    {myAns && !myAns.is_correct && (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 bg-red-100 dark:bg-red-800/30 rounded-2xl px-4 py-3">
                                                <span className="text-2xl">😅</span>
                                                <div>
                                                    <p className="font-black text-red-700 dark:text-red-300">Не совсем верно</p>
                                                    <p className="text-xs text-red-500 dark:text-red-400">Ты ответил: «{myAns.answer_text}»</p>
                                                </div>
                                            </div>
                                            {!isRev ? (
                                                <button
                                                    onClick={() => handleReveal(q.id)}
                                                    className="w-full py-2.5 border-2 border-dashed border-[#cca573]/60 text-[#cca573] rounded-2xl font-bold text-sm active:scale-95 transition-all"
                                                >
                                                    👁 Показать правильный ответ
                                                </button>
                                            ) : (
                                                <div className="bg-[#fff3e0] dark:bg-[#3d2a10] rounded-2xl px-4 py-3 border border-[#cca573]/40">
                                                    <p className="text-xs font-bold uppercase tracking-wide text-[#9e6b36] mb-0.5">Правильный ответ</p>
                                                    <p className="font-extrabold text-[#4a403b] dark:text-[#d4c8c1]">«{q.correct_answer}»</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ── Results Tab ── */}
            {tab === 'results' && (
                <div className="w-full flex flex-col gap-4">
                    {partnerQuestions.length > 0 && (
                        <div className="bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-5 border border-[#e8dfd5] dark:border-[#3d332c] flex flex-col items-center gap-2">
                            <span className="text-5xl">{correctCount === partnerQuestions.length ? '🏆' : correctCount > partnerQuestions.length / 2 ? '🥈' : '📚'}</span>
                            <p className="font-extrabold text-2xl text-[#4a403b] dark:text-[#d4c8c1]">{correctCount}/{partnerQuestions.length}</p>
                            <p className="text-sm opacity-60 font-bold">
                                {correctCount === partnerQuestions.length ? `Идеально знаешь ${resolvedPartnerName}!` : `Ты знаешь ${resolvedPartnerName} на ${Math.round(correctCount / partnerQuestions.length * 100)}%`}
                            </p>
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold text-xs uppercase tracking-wider opacity-50 px-1 text-[#4a403b] dark:text-[#d4c8c1]">Твои ответы</h3>
                        {partnerQuestions.length === 0 && <p className="opacity-50 text-sm text-center mt-4">Нет вопросов от {resolvedPartnerName}</p>}
                        {partnerQuestions.map((q, i) => {
                            const ans = myAnswers[q.id];
                            return (
                                <div key={q.id} className={`rounded-2xl p-4 border-2 ${ans?.is_correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600/40'
                                        : ans ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600/40'
                                            : 'bg-[#fdfbf9] dark:bg-[#2c2623] border-[#e8dfd5] dark:border-[#3d332c]'
                                    }`}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg shrink-0">{ans?.is_correct ? '✅' : ans ? '❌' : '⏳'}</span>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-[#4a403b] dark:text-[#d4c8c1]">{i + 1}. {q.question_text}</p>
                                            {ans && <p className="text-xs mt-0.5 opacity-70">Твой ответ: «{ans.answer_text}»</p>}
                                            {!ans && <p className="text-xs mt-0.5 opacity-40 italic">Не отвечено</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </main>
    );
}
