"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        } else if (savedTheme === 'light') {
            setTheme('light');
            document.documentElement.classList.remove('dark');
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
                document.documentElement.classList.add('dark');
            }
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    if (!mounted) return <>{children}</>;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
