"use client";

import React from "react";

type FieldProps = {
    label?: string;
    hint?: string;
    className?: string;
    children: React.ReactNode;
};

export default function Field({ label, hint, className = "", children }: FieldProps) {
    return (
        <label className={`flex w-full flex-col gap-1.5 ${className}`.trim()}>
            {label && (
                <span className="pl-1 text-[var(--text-caption)] font-black uppercase tracking-wider opacity-60">
                    {label}
                </span>
            )}
            {children}
            {hint && <span className="pl-1 text-xs opacity-60">{hint}</span>}
        </label>
    );
}

