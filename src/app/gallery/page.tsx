"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import Link from "next/link";
import { Moment } from "@/components/MomentsFeed";

export default function GalleryPage() {
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchGallery = async () => {
            const { data, error } = await supabase
                .from('moments')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setMoments(data as Moment[]);
            }
            setLoading(false);
        };
        fetchGallery();
    }, [supabase]);

    return (
        <main className="w-[100vw] min-h-[100dvh] bg-[#f2ebe3] dark:bg-[#1a1614] overflow-x-hidden flex flex-col p-4 pb-12 sm:items-center">
            <div className="w-full max-w-md pt-12 pb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 bg-white dark:bg-[#2c2623] rounded-full flex items-center justify-center shadow-sm border border-[#e8dfd5] dark:border-[#3d332c] hover:bg-[#fdfbf9] dark:hover:bg-[#3d332c] transition-colors shrink-0">
                        <span className="text-xl">←</span>
                    </Link>
                    <h1 className="text-3xl font-extrabold font-serif tracking-tight drop-shadow-sm">Галерея</h1>
                </div>
            </div>

            {loading ? (
                <div className="w-full max-w-md flex justify-center py-20 opacity-50">
                    <div className="animate-pulse text-4xl">📸</div>
                </div>
            ) : moments.length === 0 ? (
                <div className="w-full max-w-md flex flex-col items-center justify-center py-20 opacity-70">
                    <span className="text-7xl mb-4">🖼️</span>
                    <p className="font-bold text-lg text-[#4a403b] dark:text-[#d4c8c1]">Пока пусто</p>
                    <p className="text-sm font-medium mt-1">Загрузите свой первый момент на главной!</p>
                </div>
            ) : (
                <div className="w-full max-w-md grid grid-cols-2 gap-4">
                    {moments.map(m => (
                        <div key={m.id} className="relative aspect-square rounded-[24px] overflow-hidden shadow-sm border border-[#e8dfd5] dark:border-[#3d332c] group">
                            <Image src={m.photo_url} alt={m.caption || 'Moment'} fill sizes="50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            {m.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10">
                                    <p className="text-white text-xs font-bold line-clamp-2 leading-tight">{m.caption}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
