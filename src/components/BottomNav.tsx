"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-2">
            <div className="w-full max-w-sm bg-[#f2ebe3]/95 dark:bg-[#1a1614]/95 backdrop-blur-xl rounded-t-[36px] border border-[#e8dfd5] dark:border-[#3d332c] flex justify-between items-center px-4 py-3 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.05)] dark:shadow-none">
                <Link href="/" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === '/' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>
                    <span className="text-xl drop-shadow-sm">🏠</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase text-[#4a403b] dark:text-[#d4c8c1]">Дом</span>
                </Link>
                <Link href="/wishlist" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === '/wishlist' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>
                    <span className="text-xl drop-shadow-sm">🤍</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase text-[#4a403b] dark:text-[#d4c8c1]">Вишлист</span>
                </Link>
                <Link href="/journey" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === '/journey' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>
                    <span className="text-xl drop-shadow-sm">💑</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase text-[#4a403b] dark:text-[#d4c8c1]">Наш путь</span>
                </Link>
                <Link href="/plans" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === '/plans' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>
                    <span className="text-xl drop-shadow-sm">🗂️</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase text-[#4a403b] dark:text-[#d4c8c1]">Вместе</span>
                </Link>
                <Link href="/spicy" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === '/spicy' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>
                    <span className="text-xl drop-shadow-sm">🔥</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase text-[#4a403b] dark:text-[#d4c8c1]">Для двоих</span>
                </Link>
            </div>
        </div>
    );
}
