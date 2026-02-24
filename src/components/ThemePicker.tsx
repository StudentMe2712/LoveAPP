"use client";
import { PALETTES, PaletteName, useTheme } from './ThemeProvider';
import { hapticFeedback } from '@/lib/utils/haptics';

export default function ThemePicker() {
    const { palette, setPalette } = useTheme();

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50 text-[#4a403b] dark:text-[#d4c8c1]">
                🎨 Тема оформления
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {PALETTES.map(p => {
                    const isActive = palette === p.name;
                    return (
                        <button
                            key={p.name}
                            onClick={() => { hapticFeedback.light(); setPalette(p.name as PaletteName); }}
                            className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all active:scale-95 ${isActive
                                    ? 'border-[#cca573] bg-[#cca573]/10 dark:bg-[#cca573]/15 shadow-sm'
                                    : 'border-[#e8dfd5] dark:border-[#3d332c] bg-[#fdfbf9] dark:bg-[#2c2623] hover:border-[#cca573]/40'
                                }`}
                        >
                            {/* Color preview dots */}
                            <div className="flex gap-1 shrink-0">
                                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.vars['--bg'] }} />
                                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.vars['--accent'] }} />
                                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.vars['--accent2'] }} />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-sm font-extrabold text-[#4a403b] dark:text-[#d4c8c1] truncate">
                                    {p.emoji} {p.label}
                                </p>
                            </div>
                            {isActive && (
                                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#cca573]" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
