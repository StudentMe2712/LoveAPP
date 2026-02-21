"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { addWishlistItemAction, updateWishlistStatusAction } from '@/app/actions/wishlist';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

type WishItem = {
    id: string;
    title: string;
    link: string | null;
    price: string | null;
    tags: string[];
    is_hint: boolean;
    status: string;
    user_id: string;
};

export default function WishlistView() {
    const [items, setItems] = useState<WishItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [price, setPrice] = useState('');
    const [tags, setTags] = useState('');
    const [isHint, setIsHint] = useState(false);
    const [loading, setLoading] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchItems = async () => {
            const { data } = await supabase
                .from('wishlist')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setItems(data as WishItem[]);
        };
        fetchItems();

        const channel = supabase
            .channel('wishlist_feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, () => {
                fetchItems(); // simple refetch on any change for MVPs
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Добавляем желание...');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('link', link);
        formData.append('price', price);
        formData.append('tags', tags);
        if (isHint) formData.append('isHint', 'on');

        const res = await addWishlistItemAction(formData);

        if (res.error) {
            toast.error(res.error, { id: toastId });
        } else {
            toast.success('Желание добавлено! 🎁', { id: toastId });
            setTitle(''); setLink(''); setPrice(''); setTags(''); setIsHint(false);
            setIsAdding(false);
        }
        setLoading(false);
    };

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'wanted' ? 'reserved' : currentStatus === 'reserved' ? 'gifted' : 'wanted';
        await updateWishlistStatusAction(id, nextStatus);
        toast.success(`Статус обновлен на: ${nextStatus}`);
    };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center mt-6">
            <h2 className="text-3xl font-extrabold mb-6">Вишлист 🎁</h2>

            {!isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 mb-6 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-3xl font-bold text-lg shadow-sm active:scale-95 transition-all"
                >
                    + Добавить хотелку
                </button>
            )}

            {isAdding && (
                <form onSubmit={handleAdd} className="w-full bg-[#fcf8ef] dark:bg-[#3d332c] p-6 rounded-[32px] border-[4px] border-[#e3d2b3] dark:border-[#55331a] mb-8 flex flex-col gap-4">
                    <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Что хочется?" className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none" />
                    <input value={link} onChange={e => setLink(e.target.value)} placeholder="Ссылка (необязательно)" type="url" className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none" />
                    <div className="flex gap-4">
                        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Цена (~1000₽)" className="w-1/2 p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none" />
                        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Теги (дом, уют)" className="w-1/2 p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none" />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer p-2 opacity-90">
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
                {items.length === 0 && !isAdding && (
                    <div className="w-full flex flex-col items-center justify-center py-12 text-center opacity-70">
                        <span className="text-7xl drop-shadow-sm mb-4">🧸</span>
                        <p className="font-bold text-lg text-[#4a403b] dark:text-[#d4c8c1]">Вишлист пуст</p>
                        <p className="text-sm text-[#4a403b]/80 dark:text-[#d4c8c1]/80 mt-1">Добавьте сюда свои заветные желания! ✨</p>
                    </div>
                )}

                {items.map(item => (
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

                        {item.price && <p className="font-bold text-[#b98b53]">{item.price}</p>}

                        {item.tags && item.tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-1 mb-1">
                                {item.tags.map(t => <span key={t} className="text-xs px-2 py-1 bg-black/5 dark:bg-white/10 rounded-lg font-medium opacity-80">#{t}</span>)}
                            </div>
                        )}

                        {item.link && (
                            <a href={item.link} target="_blank" rel="noreferrer" className="text-sm underline text-blue-600 dark:text-blue-400 mt-1 self-start">
                                Ссылка на мечту
                            </a>
                        )}
                    </div>
                ))}
            </div>

            <Link href="/" className="mt-10 text-sm opacity-60 hover:opacity-100 font-bold underline mb-10 text-[#9e6b36] dark:text-[#cca573] decoration-2 underline-offset-4">На главную 🏡</Link>
        </div>
    );
}
