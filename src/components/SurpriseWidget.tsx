"use client";

import React, { useRef, useEffect, useState } from 'react';
import {
    getUnrevealedSurpriseAction,
    revealSurpriseAction,
    sendSurpriseAction,
    scheduleMessageAction,
} from '@/app/actions/surprises';
import confetti from 'canvas-confetti';
import { hapticFeedback } from '@/lib/utils/haptics';
import toast from 'react-hot-toast';
import { useResolvedPartnerName } from '@/lib/hooks/useResolvedPartnerName';

type Mode = 'idle' | 'instant' | 'scheduled';
type SurpriseItem = {
    id: string;
    content_text: string;
};

export default function SurpriseWidget() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [surprise, setSurprise] = useState<SurpriseItem | null>(null);
    const [isScratched, setIsScratched] = useState(false);

    // Creation state
    const [mode, setMode] = useState<Mode>('idle');
    const [newText, setNewText] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');   // datetime-local value
    const [sending, setSending] = useState(false);
    const [minDatetime] = useState(() => new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16));
    const resolvedPartnerName = useResolvedPartnerName();

    useEffect(() => {
        let mounted = true;
        getUnrevealedSurpriseAction().then(res => {
            const raw = res.surprise as Partial<SurpriseItem> | null;
            if (!mounted || !raw?.id || !raw?.content_text) return;
            setSurprise({ id: String(raw.id), content_text: String(raw.content_text) });
        });
        return () => { mounted = false; };
    }, []);

    // Scratch-off canvas setup
    useEffect(() => {
        if (!surprise || isScratched || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = containerRef.current.offsetWidth;
        canvas.height = containerRef.current.offsetHeight;

        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#78716c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁 Сотри меня', canvas.width / 2, canvas.height / 2);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 45;

        let isDrawing = false;
        let lastX = 0, lastY = 0;

        const getPos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
            return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
        };

        const start = (e: MouseEvent | TouchEvent) => {
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x; lastY = pos.y;
            ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(lastX, lastY); ctx.stroke();
            if (e.cancelable) e.preventDefault();
        };
        const move = (e: MouseEvent | TouchEvent) => {
            if (!isDrawing) return;
            const pos = getPos(e);
            ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
            lastX = pos.x; lastY = pos.y;
            if (e.cancelable) e.preventDefault();
        };
        const end = async () => {
            if (!isDrawing) return;
            isDrawing = false;
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let cleared = 0;
            for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] === 0) cleared++;
            if (cleared / (pixels.length / 4) > 0.40) {
                setIsScratched(true);
                hapticFeedback.celebration();
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                await revealSurpriseAction(surprise.id);
            }
        };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', end);
        canvas.addEventListener('mouseleave', end);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', end);
        canvas.addEventListener('touchcancel', end);

        return () => {
            canvas.removeEventListener('mousedown', start);
            canvas.removeEventListener('mousemove', move);
            canvas.removeEventListener('mouseup', end);
            canvas.removeEventListener('mouseleave', end);
            canvas.removeEventListener('touchstart', start);
            canvas.removeEventListener('touchmove', move);
            canvas.removeEventListener('touchend', end);
            canvas.removeEventListener('touchcancel', end);
        };
    }, [surprise, isScratched]);

    // Send instantly
    const handleSendInstant = async () => {
        if (!newText.trim() || sending) return;
        setSending(true);
        hapticFeedback.light();
        const res = await sendSurpriseAction(newText.trim());
        setSending(false);
        if (res.success) {
            hapticFeedback.success();
            toast.success('Сюрприз спрятан! 🎁');
            setMode('idle'); setNewText('');
        } else {
            toast.error(res.error || 'Ошибка');
        }
    };

    // Schedule message
    const handleSchedule = async () => {
        if (!newText.trim() || !scheduleTime || sending) return;
        const scheduledAt = new Date(scheduleTime).toISOString();
        if (new Date(scheduledAt) <= new Date()) {
            toast.error('Выбери время в будущем');
            return;
        }
        setSending(true);
        hapticFeedback.light();
        const res = await scheduleMessageAction(newText.trim(), scheduledAt);
        setSending(false);
        if (res.success) {
            hapticFeedback.success();
            const formatted = new Date(scheduleTime).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            toast.success(`Отправится ${formatted} 💌`);
            setMode('idle'); setNewText(''); setScheduleTime('');
        } else {
            toast.error(res.error || 'Ошибка');
        }
    };

    // --- Scratch card mode (there's a surprise to reveal) ---
    if (surprise) {
        return (
            <div className="w-full mb-6">
                <h3 className="font-extrabold text-lg text-[#4a403b] dark:text-[#d4c8c1] mb-3 flex items-center gap-2">
                    <span>🎁</span> Сюрприз дня
                </h3>
                <div
                    ref={containerRef}
                    className="relative w-full aspect-[2/1] bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] overflow-hidden flex items-center justify-center p-6 text-center"
                >
                    <p className="font-bold text-lg text-[#4a403b] dark:text-[#d4c8c1]">{surprise.content_text}</p>
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-1000 ${isScratched ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    />
                </div>
            </div>
        );
    }

    // --- Creation mode ---
    return (
        <div className="w-full mb-6 relative">
            <h3 className="font-extrabold text-lg text-[#4a403b] dark:text-[#d4c8c1] mb-3 flex items-center gap-2">
                <span>🎁</span> Сюрприз
            </h3>

            {mode === 'idle' && (
                <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                    {/* Instant surprise */}
                    <button
                        onClick={() => { hapticFeedback.light(); setMode('instant'); }}
                        className="w-full bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] flex items-center gap-3 active:scale-95 transition-transform text-[#4a403b] dark:text-[#d4c8c1]"
                    >
                        <span className="text-2xl">✍️</span>
                        <div className="text-left flex-1">
                            <p className="font-bold text-sm">Спрятать сюрприз</p>
                            <p className="text-xs opacity-50">{resolvedPartnerName} сотрёт и увидит послание</p>
                        </div>
                        <span className="text-lg opacity-30">›</span>
                    </button>
                    {/* Scheduled message */}
                    <button
                        onClick={() => { hapticFeedback.light(); setMode('scheduled'); }}
                        className="w-full bg-gradient-to-r from-[#fdfbf9] to-[#fff3f0] dark:from-[#2c2623] dark:to-[#2c1f1e] rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#f2d4c8] dark:border-[#4a2e2a] flex items-center gap-3 active:scale-95 transition-transform text-[#4a403b] dark:text-[#d4c8c1]"
                    >
                        <span className="text-2xl">⏰</span>
                        <div className="text-left flex-1">
                            <p className="font-bold text-sm">Отложенное сообщение</p>
                            <p className="text-xs opacity-50">Напишу сейчас — придёт в нужное время</p>
                        </div>
                        <span className="text-lg opacity-30">›</span>
                    </button>
                </div>
            )}

            {(mode === 'instant' || mode === 'scheduled') && (
                <div className="bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{mode === 'scheduled' ? '⏰' : '✍️'}</span>
                        <p className="font-extrabold text-sm text-[#4a403b] dark:text-[#d4c8c1]">
                            {mode === 'scheduled' ? 'Отложенное сообщение' : `Сюрприз для ${resolvedPartnerName}`}
                        </p>
                    </div>

                    <textarea
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        placeholder={mode === 'scheduled' ? 'Напишите сообщение...' : 'Напишите тайное послание...'}
                        className="w-full p-3 rounded-xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-transparent outline-none focus:border-[#cca573] resize-none h-24 text-sm font-bold text-[#4a403b] dark:text-[#d4c8c1]"
                    />

                    {mode === 'scheduled' && (
                        <div>
                            <label className="block text-xs font-bold text-[#4a403b] dark:text-[#d4c8c1] opacity-60 mb-1.5 uppercase tracking-wide">
                                Время отправки
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduleTime}
                                min={minDatetime}
                                onChange={e => setScheduleTime(e.target.value)}
                                className="w-full p-3 rounded-xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-transparent outline-none focus:border-[#cca573] text-sm font-bold text-[#4a403b] dark:text-[#d4c8c1] [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={mode === 'scheduled' ? handleSchedule : handleSendInstant}
                            disabled={sending || !newText.trim() || (mode === 'scheduled' && !scheduleTime)}
                            className="flex-1 py-2.5 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-xl font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                        >
                            {sending ? (
                                <span className="animate-spin">⏳</span>
                            ) : mode === 'scheduled' ? (
                                <><span>⏰</span> Запланировать</>
                            ) : (
                                <><span>🎁</span> Спрятать</>
                            )}
                        </button>
                        <button
                            onClick={() => { hapticFeedback.light(); setMode('idle'); setNewText(''); setScheduleTime(''); }}
                            className="px-4 py-2.5 bg-[#e8dfd5] dark:bg-[#3d332c] text-[#4a403b] dark:text-[#d4c8c1] rounded-xl font-bold transition-colors"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
