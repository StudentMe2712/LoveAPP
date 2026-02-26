"use client";

import React from "react";

type CardProps = {
    children: React.ReactNode;
    className?: string;
    padded?: boolean;
    borderStrong?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Card({ children, className = "", padded = true, borderStrong = false, ...rest }: CardProps) {
    const mergedStyle = {
        backgroundColor: "var(--bg-card)",
        borderColor: borderStrong ? "var(--accent)" : "var(--border)",
        boxShadow: "var(--shadow-soft)",
        ...(rest.style ?? {}),
    } satisfies React.CSSProperties;

    return (
        <div
            {...rest}
            className={`rounded-[var(--radius-xl)] border ${padded ? "p-5" : ""} ${className}`.trim()}
            style={mergedStyle}
        >
            {children}
        </div>
    );
}
