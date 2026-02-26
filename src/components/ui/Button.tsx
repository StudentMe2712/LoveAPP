"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
};

function variantClasses(variant: ButtonVariant): string {
    if (variant === "secondary") {
        return "border bg-transparent";
    }
    if (variant === "ghost") {
        return "border-transparent bg-transparent";
    }
    return "border text-white";
}

function variantStyles(variant: ButtonVariant): React.CSSProperties {
    if (variant === "secondary") {
        return { borderColor: "var(--border)", color: "var(--text)" };
    }
    if (variant === "ghost") {
        return { color: "var(--text)" };
    }
    return { backgroundColor: "var(--accent)", borderColor: "var(--accent)" };
}

export default function Button({
    variant = "primary",
    className = "",
    fullWidth = false,
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            {...rest}
            className={`touch-target inline-flex items-center justify-center rounded-[var(--radius-lg)] px-4 py-2.5 text-sm font-bold transition active:scale-95 disabled:opacity-50 ${fullWidth ? "w-full" : ""} ${variantClasses(variant)} ${className}`.trim()}
            style={variantStyles(variant)}
        >
            {children}
        </button>
    );
}

