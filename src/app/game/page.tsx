"use client";

import { useState } from 'react';
import Link from 'next/link';
import TicTacToeGame from '@/components/TicTacToeGame';
import DrawingBoard from '@/components/DrawingBoard';

export default function GameHubPage() {
    const [activeTab, setActiveTab] = useState<'tictactoe' | 'draw'>('tictactoe');

    return (
        <main className="w-full min-h-[100dvh] flex flex-col items-center px-6 pt-12 pb-32">
            <header className="w-full flex justify-between items-center mb-8">
                <Link href="/" className="text-2xl opacity-80 hover:opacity-100 transition-opacity">⬅️</Link>
                <h1 className="text-2xl font-extrabold tracking-tight">Поиграем? 🧩</h1>
                <div className="w-8" />
            </header>

            {/* Classic inline games */}
            <div className="flex bg-[#e8dfd5] dark:bg-[#3d332c] p-1.5 rounded-[20px] mb-8 w-full max-w-sm gap-1 shadow-inner">
                <button
                    onClick={() => setActiveTab('tictactoe')}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'tictactoe' ? 'bg-white dark:bg-[#2d2621] shadow-sm text-[#cca573] dark:text-[#b98b53]' : 'opacity-60 hover:opacity-100'}`}
                >
                    Крестики-нолики
                </button>
                <button
                    onClick={() => setActiveTab('draw')}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'draw' ? 'bg-white dark:bg-[#2d2621] shadow-sm text-[#cca573] dark:text-[#b98b53]' : 'opacity-60 hover:opacity-100'}`}
                >
                    Рисование
                </button>
            </div>

            <section className="w-full max-w-sm flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'tictactoe' ? <TicTacToeGame /> : <DrawingBoard />}
            </section>

            {/* New full-page games */}
            <div className="w-full max-w-sm mt-8 flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider opacity-50 px-1 text-[#4a403b] dark:text-[#d4c8c1]">Ещё игры</h2>

                <Link href="/game/quiz" className="w-full bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-5 border border-[#e8dfd5] dark:border-[#3d332c] flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                    <span className="text-4xl">💭</span>
                    <div className="flex-1">
                        <h3 className="font-extrabold text-[#4a403b] dark:text-[#d4c8c1]">Как ты меня знаешь?</h3>
                        <p className="text-sm opacity-50 mt-0.5">Пишите вопросы и угадывайте ответы друг о друге</p>
                    </div>
                    <span className="text-xl opacity-30">›</span>
                </Link>

                <Link href="/game/memory" className="w-full bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-5 border border-[#e8dfd5] dark:border-[#3d332c] flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                    <span className="text-4xl">🃏</span>
                    <div className="flex-1">
                        <h3 className="font-extrabold text-[#4a403b] dark:text-[#d4c8c1]">Мемори</h3>
                        <p className="text-sm opacity-50 mt-0.5">Найди пары из ваших общих фотографий</p>
                    </div>
                    <span className="text-xl opacity-30">›</span>
                </Link>

            </div>
        </main>
    );
}
