"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type PaletteName = 'warm' | 'winter' | 'forest' | 'minimal';

export type Palette = {
    name: PaletteName;
    label: string;
    emoji: string;
    vars: Record<string, string>;
    darkVars: Record<string, string>;
};

export const PALETTES: Palette[] = [
    {
        name: 'warm',
        label: 'Уютный',
        emoji: '🍂',
        vars: {
            '--bg': '#f2ebe3',
            '--bg-card': '#fdfbf9',
            '--bg-muted': '#e8dfd5',
            '--accent': '#cca573',
            '--accent-dark': '#b98b53',
            '--accent2': '#e07a5f',
            '--text': '#4a403b',
            '--text-muted': '#9e8c84',
            '--border': '#e8dfd5',
        },
        darkVars: {
            '--bg': '#1a1614',
            '--bg-card': '#2c2623',
            '--bg-muted': '#3d332c',
            '--accent': '#cca573',
            '--accent-dark': '#b98b53',
            '--accent2': '#e07a5f',
            '--text': '#d4c8c1',
            '--text-muted': '#9e8c84',
            '--border': '#3d332c',
        },
    },
    {
        name: 'winter',
        label: 'Зимний',
        emoji: '❄️',
        vars: {
            '--bg': '#eef4fb',
            '--bg-card': '#f8fbff',
            '--bg-muted': '#d8e8f5',
            '--accent': '#5b9bd5',
            '--accent-dark': '#4180b8',
            '--accent2': '#8ab4d9',
            '--text': '#2c3e50',
            '--text-muted': '#6a8aaa',
            '--border': '#d8e8f5',
        },
        darkVars: {
            '--bg': '#141c26',
            '--bg-card': '#1e2d3e',
            '--bg-muted': '#253447',
            '--accent': '#5b9bd5',
            '--accent-dark': '#4180b8',
            '--accent2': '#8ab4d9',
            '--text': '#c8daf0',
            '--text-muted': '#6a8aaa',
            '--border': '#253447',
        },
    },
    {
        name: 'forest',
        label: 'Лесной',
        emoji: '🌿',
        vars: {
            '--bg': '#edf4ee',
            '--bg-card': '#f7fbf7',
            '--bg-muted': '#d8edda',
            '--accent': '#5a9e6f',
            '--accent-dark': '#437a53',
            '--accent2': '#81b29a',
            '--text': '#2d3e2e',
            '--text-muted': '#6a8e72',
            '--border': '#d8edda',
        },
        darkVars: {
            '--bg': '#141e15',
            '--bg-card': '#1e2e1f',
            '--bg-muted': '#253c27',
            '--accent': '#5a9e6f',
            '--accent-dark': '#437a53',
            '--accent2': '#81b29a',
            '--text': '#c0dfca',
            '--text-muted': '#6a8e72',
            '--border': '#253c27',
        },
    },
    {
        name: 'minimal',
        label: 'Минимал',
        emoji: '🖤',
        vars: {
            '--bg': '#f5f5f5',
            '--bg-card': '#ffffff',
            '--bg-muted': '#e8e8e8',
            '--accent': '#222222',
            '--accent-dark': '#000000',
            '--accent2': '#555555',
            '--text': '#111111',
            '--text-muted': '#777777',
            '--border': '#e0e0e0',
        },
        darkVars: {
            '--bg': '#111111',
            '--bg-card': '#1e1e1e',
            '--bg-muted': '#2a2a2a',
            '--accent': '#e0e0e0',
            '--accent-dark': '#ffffff',
            '--accent2': '#aaaaaa',
            '--text': '#f0f0f0',
            '--text-muted': '#999999',
            '--border': '#2a2a2a',
        },
    },
];

function applyPalette(palette: Palette, isDark: boolean) {
    const vars = isDark ? palette.darkVars : palette.vars;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

function isPaletteName(value: string | null): value is PaletteName {
    return PALETTES.some((palette) => palette.name === value);
}

type ThemeCtx = {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    palette: PaletteName;
    setPalette: (p: PaletteName) => void;
    currentPalette: Palette;
};

const ThemeContext = createContext<ThemeCtx>({
    theme: 'light',
    toggleTheme: () => {},
    palette: 'warm',
    setPalette: () => {},
    currentPalette: PALETTES[0],
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Keep initial server/client render deterministic to avoid hydration mismatches.
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [palette, setPaletteState] = useState<PaletteName>('warm');
    const restoredRef = useRef(false);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const setPalette = (name: PaletteName) => {
        setPaletteState(name);
    };

    const currentPalette = PALETTES.find((p) => p.name === palette) || PALETTES[0];

    useEffect(() => {
        if (typeof window === 'undefined' || restoredRef.current) return;
        restoredRef.current = true;

        const savedTheme = localStorage.getItem('theme');
        const savedPaletteRaw = localStorage.getItem('palette');
        const savedPalette = isPaletteName(savedPaletteRaw) ? savedPaletteRaw : 'warm';

        const resolvedTheme: 'light' | 'dark' =
            savedTheme === 'light' || savedTheme === 'dark'
                ? savedTheme
                : window.matchMedia?.('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light';

        queueMicrotask(() => {
            setTheme((prev) => (prev === resolvedTheme ? prev : resolvedTheme));
            setPaletteState((prev) => (prev === savedPalette ? prev : savedPalette));
        });
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        applyPalette(currentPalette, isDark);

        if (typeof window !== 'undefined' && restoredRef.current) {
            localStorage.setItem('theme', theme);
            localStorage.setItem('palette', palette);
        }
    }, [currentPalette, palette, theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, palette, setPalette, currentPalette }}>
            {children}
        </ThemeContext.Provider>
    );
}
