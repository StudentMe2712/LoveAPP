"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { addWishlistItemAction, updateWishlistStatusAction } from '@/app/actions/wishlist';
import { createBrowserClient } from '@supabase/ssr';
import { hapticFeedback } from '@/lib/utils/haptics';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import StateBlock from '@/components/ui/StateBlock';

type WishItem = {
    id: string;
    title: string;
    link: string | null;
    price: string | null;
    tags: string[];
    is_hint: boolean;
    status: string;
    category: string;
    user_id: string;
    photo_url: string | null;
};

function normalizeWishItem(raw: Partial<WishItem>): WishItem {
    return {
        id: raw.id || `temp-${Date.now()}`,
        title: raw.title || '',
        link: raw.link || null,
        price: raw.price || null,
        tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
        is_hint: !!raw.is_hint,
        status: raw.status || 'wanted',
        category: raw.category || 'general',
        user_id: raw.user_id || '',
        photo_url: raw.photo_url || null,
    };
}

export default function WishlistView() {
    const [items, setItems] = useState<WishItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [myUserId, setMyUserId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [price, setPrice] = useState('');
    const [tags, setTags] = useState('');
    const [isHint, setIsHint] = useState(false);
    const [category, setCategory] = useState('general');
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [deletingItemIds, setDeletingItemIds] = useState<Record<string, boolean>>({});
    const photoInputRef = useRef<HTMLInputElement>(null);

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    const fetchItems = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setMyUserId(user.id);

        const { data } = await supabase
            .from('wishlist')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setItems((data as WishItem[]).map(normalizeWishItem));
    }, [supabase]);

    useEffect(() => {
        void fetchItems();

        const channel = supabase
            .channel('wishlist_feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, () => {
                void fetchItems();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchItems, supabase]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        const toastId = toast.loading('Добавляем желание...');

        const optimisticId = `temp-${Date.now()}`;
        const optimisticItem: WishItem = normalizeWishItem({
            id: optimisticId,
            title: title.trim(),
            link: link.trim() || null,
            price: price.trim() || null,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            is_hint: isHint,
            status: 'wanted',
            category,
            user_id: myUserId || '',
            photo_url: photoPreview,
        });
        setItems(prev => [optimisticItem, ...prev]);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('link', link);
        formData.append('price', price);
        formData.append('tags', tags);
        formData.append('category', category);
        if (isHint) formData.append('isHint', 'on');
        if (photoFile) formData.append('photo', photoFile);

        const res = await addWishlistItemAction(formData);

        if (res.error) {
            setItems(prev => prev.filter(item => item.id !== optimisticId));
            toast.error(res.error, { id: toastId });
        } else {
            if (res.item) {
                const normalized = normalizeWishItem(res.item as Partial<WishItem>);
                setItems(prev => prev.map(item => item.id === optimisticId ? normalized : item));
            } else {
                setItems(prev => prev.filter(item => item.id !== optimisticId));
                void fetchItems();
            }

            toast.success('Желание добавлено! 🎁', { id: toastId });
            setTitle(''); setLink(''); setPrice(''); setTags(''); setIsHint(false); setCategory('general');
            setPhotoFile(null); setPhotoPreview(null);
            setIsAdding(false);
        }
        setLoading(false);
    };

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'wanted' ? 'reserved' : currentStatus === 'reserved' ? 'gifted' : 'wanted';
        await updateWishlistStatusAction(id, nextStatus);
        toast.success(`Статус обновлен на: ${nextStatus}`);
    };

    const handleDeleteItem = async (item: WishItem) => {
        if (deletingItemIds[item.id]) return;
        if (!confirm('Точно удалить это желание?')) return;

        setDeletingItemIds(prev => ({ ...prev, [item.id]: true }));

        let removedItem: WishItem | null = null;
        let removedIndex = -1;

        setItems(prev => {
            removedIndex = prev.findIndex(wish => wish.id === item.id);
            if (removedIndex === -1) return prev;
            removedItem = prev[removedIndex];
            return prev.filter(wish => wish.id !== item.id);
        });

        const rollbackRemove = () => {
            if (!removedItem) return;
            setItems(prev => {
                if (prev.some(wish => wish.id === removedItem!.id)) return prev;
                const next = [...prev];
                const insertAt = removedIndex >= 0 && removedIndex <= next.length ? removedIndex : next.length;
                next.splice(insertAt, 0, removedItem!);
                return next;
            });
        };

        const toastId = toast.loading('Удаляем...');
        try {
            const { deleteWishlistItemAction } = await import('@/app/actions/delete');
            const res = await deleteWishlistItemAction(item.id);
            if (res.error) {
                rollbackRemove();
                toast.error(res.error, { id: toastId });
                return;
            }
            toast.success('Удалено!', { id: toastId });
            void fetchItems();
        } catch {
            rollbackRemove();
            toast.error('Не удалось удалить желание', { id: toastId });
        } finally {
            setDeletingItemIds(prev => {
                const next = { ...prev };
                delete next[item.id];
                return next;
            });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center mt-6">
            <h2 className="text-3xl font-extrabold mb-4">Вишлист 🎁</h2>

            {/* Tabs */}
            <div className="w-full flex flex-wrap gap-2 pb-4 mb-2 px-1">
                {[
                    { id: 'all', label: 'Всё ✨' },
                    { id: 'general', label: 'Общее 🏡' },
                    { id: 'hers', label: 'Для Неё 👩' },
                    { id: 'his', label: 'Для Него 👨' },
                    { id: 'gifted', label: 'Куплено 🛍️' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { hapticFeedback.light(); setActiveTab(tab.id); }}
                        className={`px-3 py-1.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-colors border-2 ${activeTab === tab.id
                            ? 'bg-[#cca573] border-[#cca573] text-white'
                            : 'bg-transparent border-[#e3d2b3] dark:border-[#55331a] text-[#cca573] opacity-70 hover:opacity-100'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {!isAdding && (
                <Button
                    onClick={() => { hapticFeedback.light(); setIsAdding(true); }}
                    fullWidth
                    className="mb-6 rounded-3xl py-4 text-lg shadow-sm"
                >
                    + Добавить хотелку
                </Button>
            )}

            {isAdding && (
                <form onSubmit={handleAdd} className="w-full bg-[#fcf8ef] dark:bg-[#3d332c] p-6 rounded-[32px] border-[4px] border-[#e3d2b3] dark:border-[#55331a] mb-8 flex flex-col gap-4">
                    <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Что хочется?" className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none" />
                    <input value={link} onChange={e => setLink(e.target.value)} placeholder="Ссылка (необязательно)" type="url" className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none" />
                    <div className="flex gap-4">
                        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Цена (~1000₸)" className="w-1/2 p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none" />
                        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Теги (дом, уют)" className="w-1/2 p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 pl-1">Категория</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none font-bold text-[#4a403b] dark:text-[#d4c8c1] appearance-none"
                        >
                            <option value="general">Общее 🏡</option>
                            <option value="hers">Для Неё 👩</option>
                            <option value="his">Для Него 👨</option>
                        </select>
                    </div>

                    {/* Photo picker */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 pl-1">Фото (необязательно)</label>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                setPhotoFile(f);
                                if (f) setPhotoPreview(URL.createObjectURL(f));
                                else setPhotoPreview(null);
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="w-full rounded-xl border-2 border-dashed border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] flex items-center justify-center overflow-hidden transition-colors hover:border-[#cca573]"
                            style={{ minHeight: 80 }}
                        >
                            {photoPreview ? (
                                <div className="relative w-full h-32">
                                    <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                                </div>
                            ) : (
                                <span className="text-sm text-[#9e6b36] dark:text-[#cca573] font-bold opacity-60">📸 Добавить фото</span>
                            )}
                        </button>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer p-2 opacity-90 mt-1">
                        <input type="checkbox" checked={isHint} onChange={e => setIsHint(e.target.checked)} className="w-5 h-5 accent-[#b98b53] rounded" />
                        <span className="font-semibold text-sm">Это тонкий намек 😏</span>
                    </label>

                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 border-2 border-[#e3d2b3] dark:border-[#855328] text-[#9e6b36] dark:text-[#cca573] rounded-xl font-bold">Отмена</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#b98b53] hover:bg-[#9e6b36] text-white rounded-xl font-bold disabled:opacity-50 transition-colors">Сохранить</button>
                    </div>
                </form>
            )}

            <div className="w-full flex flex-col gap-4">
                {items.filter(i => {
                    if (activeTab === 'gifted') return i.status === 'gifted';
                    if (i.status === 'gifted') return false;
                    if (activeTab === 'all') return true;
                    return i.category === activeTab;
                }).length === 0 && !isAdding && (
                        <StateBlock
                            icon="🧸"
                            title="Пустовато..."
                            description={activeTab === 'gifted' ? 'Пока ничего не подарено!' : 'Добавьте сюда свои заветные желания! ✨'}
                            className="py-12 opacity-80"
                        />
                    )}

                {items.filter(i => {
                    if (activeTab === 'gifted') return i.status === 'gifted';
                    if (i.status === 'gifted') return false;
                    if (activeTab === 'all') return true;
                    return i.category === activeTab;
                }).map(item => (
                    <div key={item.id} className={`p-5 rounded-3xl border-2 transition-all flex flex-col gap-1 ${item.status === 'gifted' ? 'bg-[#f0f9f0] dark:bg-[#203320] border-[#a3d9a3] opacity-60' : item.is_hint ? 'bg-[#fff5f8] dark:bg-[#3d262d] border-[#ffcce0] dark:border-[#8f4f66]' : 'bg-white dark:bg-[#2d2621] border-[#e3d2b3] dark:border-[#55331a]'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-xl font-bold font-serif leading-tight pr-2">{item.title} {item.is_hint && '😏'}</h3>
                            <button
                                onClick={() => handleStatusToggle(item.id, item.status)}
                                className="text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider bg-[#f5eedc] dark:bg-[#452a17] text-[#9e6b36] dark:text-[#cca573] hover:bg-[#e3d2b3] dark:hover:bg-[#55331a] whitespace-nowrap"
                            >
                                {item.status === 'wanted' ? 'Хочу' : item.status === 'reserved' ? 'Бронь' : 'Подарено'}
                            </button>
                        </div>

                        {/* Photo */}
                        {item.photo_url && (
                            <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-2">
                                <Image src={item.photo_url} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                            </div>
                        )}

                        <details className="mt-1 group cursor-pointer">
                            <summary className="text-sm text-[#9e6b36] dark:text-[#cca573] font-bold opacity-80 hover:opacity-100 list-none flex items-center gap-2 select-none">
                                <span className="text-xs group-open:rotate-180 transition-transform duration-300">▼</span> Открыть детали
                            </summary>
                            <div className="pt-3 flex flex-col gap-2 cursor-auto">
                                {item.price && <p className="font-bold text-[#b98b53]">Цена: {item.price}</p>}

                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {item.tags.map(t => <span key={t} className="text-xs px-2 py-1 bg-black/5 dark:bg-white/10 rounded-lg font-medium opacity-80">#{t}</span>)}
                                    </div>
                                )}

                                {item.link && (
                                    <a href={item.link} target="_blank" rel="noreferrer" className="text-sm underline text-blue-600 dark:text-blue-400 self-start mt-1">
                                        🔗 Ссылка на местечко/товар
                                    </a>
                                )}

                                {myUserId === item.user_id && (
                                    <button
                                        type="button"
                                        onClick={() => { void handleDeleteItem(item); }}
                                        disabled={!!deletingItemIds[item.id]}
                                        className="text-xs font-bold text-red-400 hover:text-red-500 opacity-60 hover:opacity-100 self-start mt-3 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {deletingItemIds[item.id] ? 'Удаляем...' : '🗑️ Удалить желание'}
                                    </button>
                                )}
                            </div>
                        </details>
                    </div>
                ))}
            </div>

            <Link href="/" className="mt-10 text-sm opacity-60 hover:opacity-100 font-bold underline mb-10 text-[#9e6b36] dark:text-[#cca573] decoration-2 underline-offset-4">На главную 🏡</Link>
        </div>
    );
}
