"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { submitAnswerAction } from '@/app/actions/questions';
import { createBrowserClient } from '@supabase/ssr';

type Question = {
    id: string;
    text: string;
    pack_id: string;
};

export default function QuestionsView() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answer, setAnswer] = useState('');
    const [saveToMemory, setSaveToMemory] = useState(false);
    const [loading, setLoading] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchQuestions = async () => {
            const { data } = await supabase.from('questions').select('*').limit(50);
            if (data) setQuestions(data as Question[]);
        };
        fetchQuestions();
    }, [supabase]);

    if (questions.length === 0) {
        return <div className="p-10 text-center opacity-50">Загрузка вопросов...</div>;
    }

    const currentQ = questions[currentIdx];

    const handleSubmit = async () => {
        if (!answer.trim()) {
            toast.error("Напиши хоть словечко 🥺");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Сохраняем ответ...");

        const res = await submitAnswerAction(currentQ.id, answer, saveToMemory);
        if (res?.error) {
            toast.error(res.error, { id: toastId });
        } else {
            toast.success("Ответ сохранен! 💖", { id: toastId });
            setAnswer('');
            setSaveToMemory(false);

            // Move to next question if available
            if (currentIdx < questions.length - 1) {
                setCurrentIdx(prev => prev + 1);
            } else {
                toast("Вы ответили на все вопросы! 🎉", { icon: '👏' });
            }
        }
        setLoading(false);
    };

    return (
        <div className="w-full flex flex-col gap-6 max-w-md mx-auto items-center mt-10 p-4">
            <h2 className="text-3xl font-extrabold mb-2 text-center">Вопросы для нас ☕</h2>

            <div className="w-full bg-[#fcf8ef] dark:bg-[#3d332c] p-8 rounded-[32px] shadow-sm border-[4px] border-[#e3d2b3] dark:border-[#55331a] relative">
                <span className="absolute -top-4 -right-2 text-4xl transform rotate-12">💡</span>
                <p className="text-sm font-bold text-[#b98b53] mb-4 uppercase tracking-wider">{currentQ.pack_id}</p>
                <h3 className="text-2xl font-bold leading-snug mb-8">{currentQ.text}</h3>

                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Твой ответ..."
                    className="w-full h-32 p-4 rounded-2xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] focus:ring-4 focus:ring-[#f5eedc] transition-all resize-none mb-4"
                />

                <label className="flex items-center gap-3 cursor-pointer mb-6 select-none bg-[#f5eedc] dark:bg-[#2d2621] p-3 rounded-xl border border-transparent hover:border-[#e3d2b3]">
                    <input
                        type="checkbox"
                        checked={saveToMemory}
                        onChange={(e) => setSaveToMemory(e.target.checked)}
                        className="w-5 h-5 accent-[#b98b53] rounded"
                    />
                    <span className="font-semibold text-sm opacity-90">Запомнить в Memory Vault 🧠</span>
                </label>

                <div className="flex gap-3">
                    <button
                        aria-label="Предыдущий вопрос"
                        onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentIdx === 0 || loading}
                        className="p-4 bg-transparent border-2 border-[#e3d2b3] dark:border-[#855328] rounded-2xl font-bold disabled:opacity-40"
                    >
                        ⬅️
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!answer.trim() || loading}
                        className="flex-1 py-4 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold text-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {loading ? '...' : 'Ответить'}
                    </button>
                    <button
                        aria-label="Следующий вопрос"
                        onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                        disabled={currentIdx === questions.length - 1 || loading}
                        className="p-4 bg-transparent border-2 border-[#e3d2b3] dark:border-[#855328] rounded-2xl font-bold disabled:opacity-40"
                    >
                        ➡️
                    </button>
                </div>
            </div>
        </div>
    );
}
