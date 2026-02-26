"use client";

import { PALETTES, PaletteName, useTheme } from "./ThemeProvider";
import { hapticFeedback } from "@/lib/utils/haptics";

export default function ThemePicker() {
    const { palette, setPalette, theme } = useTheme();

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50 text-[#4a403b] dark:text-[#d4c8c1]">
                🎨 Тема оформления
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {PALETTES.map((p) => {
                    const isActive = palette === p.name;
                    const previewVars = theme === "dark" ? p.darkVars : p.vars;

                    return (
                        <button
                            key={p.name}
                            onClick={() => {
                                hapticFeedback.light();
                                setPalette(p.name as PaletteName);
                            }}
                            className={`relative flex items-center gap-3 rounded-2xl border-2 p-3 transition-all active:scale-95 ${
                                isActive
                                    ? "border-[#cca573] bg-[#cca573]/10 shadow-sm dark:bg-[#cca573]/15"
                                    : "border-[#e8dfd5] bg-[#fdfbf9] hover:border-[#cca573]/40 dark:border-[#3d332c] dark:bg-[#2c2623]"
                            }`}
                        >
                            <div className="flex shrink-0 gap-1">
                                <div className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: previewVars["--bg"] }} />
                                <div className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: previewVars["--accent"] }} />
                                <div className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: previewVars["--accent2"] }} />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                                <p className="truncate text-sm font-extrabold text-[#4a403b] dark:text-[#d4c8c1]">
                                    {p.emoji} {p.label}
                                </p>
                            </div>
                            {isActive && <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#cca573]" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
