"use client";

import React from "react";
import Link from "next/link";

type BackButtonProps = {
    href?: string;
    onClick?: () => void;
    className?: string;
    ariaLabel?: string;
};

const BASE_CLASS =
    "touch-target inline-flex h-11 w-11 items-center justify-center rounded-full border text-[20px] font-black leading-none transition-transform active:scale-95";

const BASE_STYLE = {
    backgroundColor: "rgba(15, 9, 12, 0.52)",
    borderColor: "rgba(255, 255, 255, 0.32)",
    color: "rgba(255, 248, 236, 0.96)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
} satisfies React.CSSProperties;

export default function BackButton({ href, onClick, className = "", ariaLabel = "Назад" }: BackButtonProps) {
    const content = <span aria-hidden>←</span>;
    const classes = `${BASE_CLASS} ${className}`.trim();

    if (onClick) {
        return (
            <button type="button" onClick={onClick} aria-label={ariaLabel} className={classes} style={BASE_STYLE}>
                {content}
            </button>
        );
    }

    return (
        <Link href={href ?? "/"} aria-label={ariaLabel} className={classes} style={BASE_STYLE}>
            {content}
        </Link>
    );
}