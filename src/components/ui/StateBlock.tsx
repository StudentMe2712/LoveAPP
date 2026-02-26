"use client";

import React from "react";
import Button from "@/components/ui/Button";

type StateBlockProps = {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
};

export default function StateBlock({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className = "",
}: StateBlockProps) {
    return (
        <div
            className={`flex w-full flex-col items-center justify-center rounded-[var(--radius-xl)] border px-4 py-10 text-center ${className}`.trim()}
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
            {icon && <span className="mb-3 text-5xl">{icon}</span>}
            <p className="text-base font-black">{title}</p>
            {description && <p className="mt-1 max-w-[28ch] text-sm opacity-70">{description}</p>}
            {actionLabel && onAction && (
                <Button className="mt-4" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

