"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname();
    if (pathname === "/journey") return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-2">
            <div
                className="w-full max-w-sm backdrop-blur-xl rounded-t-[36px] border flex justify-between items-center px-4 py-3 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.05)]"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
            >
                <Link href="/" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === "/" ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
                    <span className="text-xl drop-shadow-sm">🏠</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase" style={{ color: "var(--text)" }}>Дом</span>
                </Link>
                <Link href="/wishlist" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === "/wishlist" ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
                    <span className="text-xl drop-shadow-sm">🤍</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase" style={{ color: "var(--text)" }}>Вишлист</span>
                </Link>
                <Link href="/journey" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === "/journey" ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
                    <span className="text-xl drop-shadow-sm">💑</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase" style={{ color: "var(--text)" }}>Наш путь</span>
                </Link>
                <Link href="/plans" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === "/plans" ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
                    <span className="text-xl drop-shadow-sm">🗂️</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase" style={{ color: "var(--text)" }}>Вместе</span>
                </Link>
                <Link href="/spicy" className={`flex flex-col items-center gap-1 transition-opacity ${pathname === "/spicy" ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
                    <span className="text-xl drop-shadow-sm">🔥</span>
                    <span className="text-[9px] font-extrabold tracking-wide uppercase" style={{ color: "var(--text)" }}>Для двоих</span>
                </Link>
            </div>
        </div>
    );
}
