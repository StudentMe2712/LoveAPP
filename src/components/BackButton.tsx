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
    "inline-flex h-10 w-10 items-center justify-center rounded-xl text-2xl leading-none transition-transform active:scale-95";

export default function BackButton({ href, onClick, className = "", ariaLabel = "Назад" }: BackButtonProps) {
    const content = <span aria-hidden>⬅️</span>;
    const classes = `${BASE_CLASS} ${className}`.trim();

    if (onClick) {
        return (
            <button type="button" onClick={onClick} aria-label={ariaLabel} className={classes}>
                {content}
            </button>
        );
    }

    return (
        <Link href={href ?? "/"} aria-label={ariaLabel} className={classes}>
            {content}
        </Link>
    );
}

