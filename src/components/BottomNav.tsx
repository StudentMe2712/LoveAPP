"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname() || "/";
    const items = [
        { href: "/", emoji: "🏠", label: "Дом" },
        { href: "/chat", emoji: "💬", label: "Чат" },
        { href: "/wishlist", emoji: "🤍", label: "Вишлист" },
        { href: "/journey", emoji: "💑", label: "Наш путь" },
        { href: "/plans", emoji: "🗂️", label: "Вместе" },
        { href: "/spicy", emoji: "🔥", label: "Для двоих" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[calc(var(--space-2)+env(safe-area-inset-bottom,0px))]">
            <div
                className="w-full max-w-sm backdrop-blur-xl rounded-t-[36px] border flex justify-between items-center px-3 py-2.5 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.05)]"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
            >
                {items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`touch-target min-w-0 flex-1 flex flex-col items-center gap-1 transition-opacity ${active ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                        >
                            <span className="text-[19px] drop-shadow-sm leading-none">{item.emoji}</span>
                            <span
                                className="text-[8px] sm:text-[9px] font-extrabold tracking-wide uppercase text-center leading-none"
                                style={{ color: "var(--text)" }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
