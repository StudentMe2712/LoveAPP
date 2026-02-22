"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { createMomentAction } from '@/app/actions/moments';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Link from 'next/link';

export type Moment = {
    id: string;
    sender_id: string;
    photo_url: string;
    caption: string | null;
    created_at: string;
};

export default function MomentsFeed() {
    const [moment, setMoment] = useState<Moment | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchMoments = async () => {
            const { data, error } = await supabase
                .from('moments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                setMoment(data as Moment);
            }
        };

        fetchMoments();

        const channel = supabase
            .channel('moments_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, (payload) => {
                const newMoment = payload.new as Moment;
                setMoment(newMoment);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const toastId = toast.loading('Делимся моментом... 📸');

        try {
            const formData = new FormData();
            formData.append('photo', file);

            const res = await createMomentAction(formData);

            if (res?.error) {
                toast.error(res.error, { id: toastId });
            } else {
                toast.success('Момент отправлен! 💖', { id: toastId });
            }
        } catch (err) {
            toast.error('Ошибка загрузки', { id: toastId });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full mt-6">
            <div className="w-full flex justify-between items-end mb-2 px-2">
                <h2 className="text-[#6b5c54] dark:text-[#a3948c] font-bold text-sm">Сегодняшний момент</h2>
                <Link href="/gallery" className="text-xs font-bold text-[#cca573] dark:text-[#b98b53] hover:underline">Галерея →</Link>
            </div>

            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />

            <div
                onClick={() => fileInputRef.current?.click()}
                className={`bg-[#fdfbf9] dark:bg-[#2c2623] rounded-[24px] p-2 pr-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e8dfd5] dark:border-[#3d332c] flex gap-4 items-center cursor-pointer hover:bg-white dark:hover:bg-[#342e2a] transition-all active:scale-[0.98] ${uploading ? 'opacity-70 animate-pulse' : ''}`}
            >
                {moment ? (
                    <>
                        <div className="relative w-[100px] h-[75px] bg-gray-200 rounded-[18px] overflow-hidden shrink-0">
                            <Image src={moment.photo_url} alt="Moment" fill sizes="100px" className="object-cover" />
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                            <p className="text-sm text-[#4a403b] dark:text-[#d4c8c1] font-bold leading-tight mb-2 line-clamp-2">
                                {moment.caption || 'Нажми, чтобы обновить момент!'}
                            </p>
                            <button disabled className="bg-[#a3948c]/20 text-[#6b5c54] dark:text-[#d4c8c1] text-xs px-4 py-1.5 rounded-full self-start font-bold flex items-center gap-1 pointer-events-none">
                                ▶ Послушать
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-[100px] h-[75px] bg-[#f2ebe3] dark:bg-[#1a1614] rounded-[18px] border border-dashed border-[#d4c8c1] dark:border-[#4a403b] flex items-center justify-center shrink-0">
                            <span className="text-2xl">📸</span>
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                            <p className="text-sm text-[#4a403b] dark:text-[#d4c8c1] font-bold leading-tight mb-2">
                                Выбери фото для сегодняшнего момента
                            </p>
                            <button disabled className="bg-[#a3948c]/20 text-[#6b5c54] dark:text-[#d4c8c1] text-xs px-4 py-1.5 rounded-full self-start font-bold flex items-center gap-1 pointer-events-none">
                                + Загрузить
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
