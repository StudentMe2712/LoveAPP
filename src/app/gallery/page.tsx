"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import toast from "react-hot-toast";
import { hapticFeedback } from "@/lib/utils/haptics";
import BackButton from "@/components/BackButton";
import Card from "@/components/ui/Card";
import StateBlock from "@/components/ui/StateBlock";

type Moment = {
    id: string;
    sender_id: string;
    photo_url: string;
    caption: string | null;
    created_at: string;
    is_liked: boolean | null;
    is_favorited: boolean | null;
};

/* ─── 3-dot dropdown menu ─────────────────────────────────────── */
function MomentMenu({
    moment,
    isOwner,
    onDelete,
}: {
    moment: Moment;
    isOwner: boolean;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleDownload = () => {
        setOpen(false);
        const a = document.createElement('a');
        a.href = moment.photo_url;
        a.download = `nash-domik-${moment.id}.jpg`;
        a.target = '_blank';
        a.click();
    };

    const handleDelete = async () => {
        setOpen(false);
        if (!confirm("Удалить это фото навсегда?")) return;
        const { deleteMomentAction } = await import('@/app/actions/delete');
        const res = await deleteMomentAction(moment.id);
        if (res.error) toast.error(res.error);
        else { hapticFeedback.success(); onDelete(); }
    };

    return (
        <div ref={ref} className="absolute top-2 right-2 z-10">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); hapticFeedback.light(); }}
                className="w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all font-extrabold text-base"
            >
                ···
            </button>
            {open && (
                <div
                    className="absolute top-10 right-0 bg-white dark:bg-[#2c2623] rounded-2xl shadow-xl border border-[#e8dfd5] dark:border-[#3d332c] overflow-hidden min-w-[140px] z-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-[#4a403b] dark:text-[#d4c8c1] hover:bg-[#f2ebe3] dark:hover:bg-[#3d332c] transition-colors"
                    >
                        ⬇️ Скачать
                    </button>
                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-[#e8dfd5] dark:border-[#3d332c]"
                        >
                            🗑️ Удалить
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Lightbox ─────────────────────────────────────────────────── */
function Lightbox({
    moment,
    total,
    index,
    isOwner,
    onClose,
    onPrev,
    onNext,
    onUpdate,
}: {
    moment: Moment;
    total: number;
    index: number;
    isOwner: boolean;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    onUpdate: (patch: Partial<Moment>) => void;
}) {
    const [caption, setCaption] = useState(moment.caption || '');
    const [savingCaption, setSavingCaption] = useState(false);
    const [liked, setLiked] = useState(!!moment.is_liked);
    const [favorited, setFavorited] = useState(!!moment.is_favorited);

    // Sync state when moment changes (navigation)
    useEffect(() => {
        setCaption(moment.caption || '');
        setLiked(!!moment.is_liked);
        setFavorited(!!moment.is_favorited);
    }, [moment.id, moment.caption, moment.is_liked, moment.is_favorited]);

    const handleSaveCaption = async () => {
        setSavingCaption(true);
        const { updateMomentCaptionAction } = await import('@/app/actions/moments');
        const res = await updateMomentCaptionAction(moment.id, caption);
        setSavingCaption(false);
        if (res.error) toast.error(res.error);
        else {
            toast.success('Подпись сохранена ✓', { duration: 1200 });
            onUpdate({ caption: caption.trim() || null });
            onClose();
        }
    };

    const handleLike = async () => {
        const next = !liked;
        setLiked(next);
        hapticFeedback.light();
        const { toggleLikeMomentAction } = await import('@/app/actions/moments');
        await toggleLikeMomentAction(moment.id, next);
        onUpdate({ is_liked: next });
    };

    const handleFavorite = async () => {
        const next = !favorited;
        setFavorited(next);
        hapticFeedback.medium();
        const { toggleFavoriteMomentAction } = await import('@/app/actions/moments');
        await toggleFavoriteMomentAction(moment.id, next);
        onUpdate({ is_favorited: next });
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
            onClick={onClose}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2 z-[110]" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="text-white/70 hover:text-white text-sm font-bold px-3 py-2 rounded-xl bg-white/10 transition-colors">
                    ✕ Закрыть
                </button>
                <span className="text-white/50 text-sm font-bold">{index + 1} / {total}</span>
                <div className="flex gap-2">
                    {/* Like button */}
                    <button
                        onClick={handleLike}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${liked ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white/70 hover:text-white'}`}
                    >
                        {liked ? '❤️' : '🤍'}
                    </button>
                    {/* Favorite button */}
                    <button
                        onClick={handleFavorite}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${favorited ? 'bg-amber-500/80 text-white' : 'bg-white/10 text-white/70 hover:text-white'}`}
                    >
                        {favorited ? '⭐' : '☆'}
                    </button>
                </div>
            </div>

            {/* Image */}
            <div className="flex-1 relative flex items-center justify-center" onClick={onClose}>
                <div className="relative w-full h-full max-w-2xl mx-auto">
                    <Image
                        src={moment.photo_url}
                        alt={moment.caption || 'Moment'}
                        fill
                        className="object-contain"
                        sizes="100vw"
                    />
                </div>

                {/* Prev/Next arrows */}
                {index > 0 && (
                    <button
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-black/40 w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/70 transition-colors z-[110]"
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    >◀</button>
                )}
                {index < total - 1 && (
                    <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-black/40 w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/70 transition-colors z-[110]"
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                    >▶</button>
                )}
            </div>

            {/* Caption editor at the bottom */}
            <div
                className="px-4 pb-8 pt-3 bg-gradient-to-t from-black/80 to-transparent z-[110]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex gap-2 items-end">
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Добавь подпись к фото..."
                        rows={2}
                        className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 rounded-2xl px-4 py-3 text-sm font-medium resize-none outline-none focus:border-white/40 transition-colors"
                    />
                    <button
                        onClick={handleSaveCaption}
                        disabled={savingCaption || caption === (moment.caption || '')}
                        className="px-4 py-3 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 shrink-0"
                    >
                        {savingCaption ? '...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Gallery Page ──────────────────────────────────────────────── */
export default function GalleryPage() {
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);
    const [myUserId, setMyUserId] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'liked' | 'favorited'>('all');

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            ),
        [],
    );

    useEffect(() => {
        const fetchGallery = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setMyUserId(user.id);

            const { data } = await supabase
                .from('moments')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setMoments(data as Moment[]);
            setLoading(false);
        };
        fetchGallery();
    }, [supabase]);

    const updateMoment = useCallback((id: string, patch: Partial<Moment>) => {
        setMoments(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    }, []);

    const filteredMoments = moments.filter(m => {
        if (filter === 'liked') return m.is_liked;
        if (filter === 'favorited') return m.is_favorited;
        return true;
    });

    // Group by month
    const grouped = Object.entries(
        filteredMoments.reduce((acc, m) => {
            const key = format(new Date(m.created_at), 'LLLL yyyy', { locale: ru });
            if (!acc[key]) acc[key] = [];
            acc[key].push(m);
            return acc;
        }, {} as Record<string, Moment[]>)
    );

    const selectedMoment = selectedIndex !== null ? filteredMoments[selectedIndex] : null;

    return (
        <main className="app-safe-top app-safe-bottom w-full min-h-[100dvh] flex flex-col items-center p-4">
            {/* Header */}
            <div className="w-full max-w-md pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BackButton href="/" className="shrink-0" />
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#4a403b] dark:text-[#d4c8c1]">Галерея</h1>
                </div>
                <span className="text-sm font-bold text-[#9e8c84]">{moments.length} фото</span>
            </div>

            {/* Filter tabs */}
            <div className="w-full max-w-md flex gap-2 mb-4">
                {([
                    { id: 'all', label: '📸 Все' },
                    { id: 'liked', label: '❤️ Любимые' },
                    { id: 'favorited', label: '⭐ Избранное' },
                ] as const).map(f => (
                    <button
                        key={f.id}
                        onClick={() => { setFilter(f.id); hapticFeedback.light(); }}
                        className={`flex-1 py-2 rounded-2xl text-xs font-extrabold transition-all ${filter === f.id
                            ? 'bg-[#cca573] text-white shadow-sm'
                            : 'bg-white dark:bg-[#2c2623] text-[#4a403b] dark:text-[#d4c8c1] border border-[#e8dfd5] dark:border-[#3d332c]'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <StateBlock icon="📸" title="Загружаем галерею..." className="w-full max-w-md py-20 opacity-60" />
            ) : filteredMoments.length === 0 ? (
                <StateBlock
                    icon="🖼️"
                    title={filter === 'all' ? 'Пока пусто' : 'Здесь пусто'}
                    description={filter === 'liked' ? 'Лайкай фото в галерее ❤️' : filter === 'favorited' ? 'Добавляй фото в избранное ⭐' : 'Загрузите первый момент на главной!'}
                    className="w-full max-w-md py-20 opacity-80"
                />
            ) : (
                <div className="w-full max-w-md flex flex-col gap-8">
                    {grouped.map(([month, monthMoments]) => (
                        <div key={month}>
                            <h2 className="text-base font-extrabold mb-3 text-[#4a403b] dark:text-[#d4c8c1] capitalize px-1">{month}</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {monthMoments.map(m => {
                                    const idxInFiltered = filteredMoments.findIndex(x => x.id === m.id);
                                    return (
                                        <Card
                                            key={m.id}
                                            onClick={() => setSelectedIndex(idxInFiltered)}
                                            padded={false}
                                            className="relative cursor-pointer aspect-square rounded-[20px] overflow-hidden shadow-sm border border-[#e8dfd5] dark:border-[#3d332c] group"
                                        >
                                            <Image
                                                src={m.photo_url}
                                                alt={m.caption || 'Moment'}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 200px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />

                                            {/* Caption overlay */}
                                            {m.caption && (
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-end">
                                                    <p className="text-white text-xs font-bold line-clamp-2 leading-tight">{m.caption}</p>
                                                </div>
                                            )}

                                            {/* Like/Favorite badges */}
                                            <div className="absolute top-2 left-2 flex gap-1">
                                                {m.is_liked && <span className="text-sm drop-shadow">❤️</span>}
                                                {m.is_favorited && <span className="text-sm drop-shadow">⭐</span>}
                                            </div>

                                            {/* 3-dot menu */}
                                            <MomentMenu
                                                moment={m}
                                                isOwner={myUserId === m.sender_id}
                                                onDelete={() => setMoments(prev => prev.filter(x => x.id !== m.id))}
                                            />
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {selectedMoment && selectedIndex !== null && (
                <Lightbox
                    moment={selectedMoment}
                    total={filteredMoments.length}
                    index={selectedIndex}
                    isOwner={myUserId === selectedMoment.sender_id}
                    onClose={() => setSelectedIndex(null)}
                    onPrev={() => setSelectedIndex(i => (i !== null && i > 0 ? i - 1 : i))}
                    onNext={() => setSelectedIndex(i => (i !== null && i < filteredMoments.length - 1 ? i + 1 : i))}
                    onUpdate={(patch) => updateMoment(selectedMoment.id, patch)}
                />
            )}
        </main>
    );
}
