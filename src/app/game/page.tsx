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
                <Link href="/" className="text-2xl opacity-80 hover:opacity-100 transition-opacity">
                    ⬅️
                </Link>
                <h1 className="text-2xl font-extrabold tracking-tight">Поиграем? 🧩</h1>
                <div className="w-8"></div>
            </header>

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
        </main>
    );
}
