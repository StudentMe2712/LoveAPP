"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { sendSignalAction } from '@/app/actions/signals';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import MomentsFeed from '@/components/MomentsFeed';
import PlansWidget from '@/components/PlansWidget';
import AIWidget from '@/components/AIWidget';
import { useTheme } from '@/components/ThemeProvider';

export default function Home() {
  const [loading, setLoading] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState<string>('сладкий');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata) {
        if (user.user_metadata.display_name) setDisplayName(user.user_metadata.display_name);
        if (user.user_metadata.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
      }
    };
    fetchProfile();
  }, []);

  const handleSignalClick = async (signalId: string, label: string) => {
    if (loading) return;
    setLoading(signalId);

    const toastId = toast.loading(`Отправляю: ${label}...`);

    try {
      const res = await sendSignalAction(signalId);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success('Сигнал успешно отправлен! ✨', { id: toastId });
      }
    } catch (err) {
      toast.error('Произошла ошибка', { id: toastId });
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen pt-12 pb-32 px-5 flex flex-col items-center max-w-sm mx-auto relative overflow-x-hidden text-[#4a403b] dark:text-[#d4c8c1]">
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#fdfbf9', color: '#4a403b', borderRadius: '16px', fontWeight: 'bold' } }} />

      {/* Header */}
      <header className="w-full flex justify-between items-center mb-8 px-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl drop-shadow-sm">❤️</span>
          <h1 className="text-xl font-extrabold tracking-tight">Домик для двоих</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" aria-label="Настройки" className="text-2xl opacity-80 hover:opacity-100 transition-opacity">
            ⚙️
          </Link>
          <button aria-label="Переключить тему" onClick={toggleTheme} className="text-2xl opacity-80 hover:opacity-100 transition-opacity">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="w-9 h-9 rounded-full border border-[#d4c8c1] dark:border-[#4a403b] flex items-center justify-center bg-white/50 dark:bg-white/5">
            <span className="text-lg opacity-80 pb-0.5">🔔</span>
          </div>
        </div>
      </header>

      {/* Greeting */}
      <div className="w-full mb-6 flex items-center justify-between px-2">
        <div className="flex flex-col items-start pr-2">
          <h2 className="text-3xl font-extrabold font-serif tracking-tight mb-1 drop-shadow-sm">Привет, {displayName}!</h2>
          <p className="text-base font-medium opacity-80">Что сейчас хочется?</p>
        </div>
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-[#e8dfd5] dark:border-[#3d332c] shadow-sm shrink-0" />
        )}
      </div>

      {/* Primary 2x2 Grid */}
      <section className="grid grid-cols-2 gap-3 w-full z-10">
        <button
          onClick={() => handleSignalClick('miss_you', 'Скучаю')}
          disabled={!!loading}
          className="bg-[#fdfbf9] dark:bg-[#2c2623] text-[#4a403b] dark:text-[#d4c8c1] rounded-[24px] py-4 px-4 font-bold shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] flex items-center justify-between active:scale-95 transition-all"
        >
          <span className="text-[16px] font-extrabold tracking-wide leading-tight text-left">Скучаю</span>
          <span className="text-3xl drop-shadow-sm ml-1">🧸</span>
        </button>

        <button
          onClick={() => handleSignalClick('want_to_talk', 'Поговорить')}
          disabled={!!loading}
          className="bg-[#fdfbf9] dark:bg-[#2c2623] text-[#4a403b] dark:text-[#d4c8c1] rounded-[24px] py-4 px-4 font-bold shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] flex items-center justify-between active:scale-95 transition-all"
        >
          <span className="text-[16px] font-extrabold tracking-wide leading-tight text-left">Поговорить</span>
          <span className="text-3xl drop-shadow-sm ml-1">💬</span>
        </button>

        <button
          onClick={() => handleSignalClick('hugs', 'Обнимашки')}
          disabled={!!loading}
          className="bg-[#fdfbf9] dark:bg-[#2c2623] text-[#4a403b] dark:text-[#d4c8c1] rounded-[24px] py-4 px-4 font-bold shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] flex items-center justify-between active:scale-95 transition-all"
        >
          <span className="text-[16px] font-extrabold tracking-wide leading-tight text-left">Обнимашки</span>
          <span className="text-3xl drop-shadow-sm ml-1">🫂</span>
        </button>

        <button
          onClick={() => handleSignalClick('heavy', 'Мне тяжело')}
          disabled={!!loading}
          className="bg-[#fdfbf9] dark:bg-[#2c2623] text-[#4a403b] dark:text-[#d4c8c1] rounded-[24px] py-4 px-4 font-bold shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] flex items-center justify-between active:scale-95 transition-all"
        >
          <span className="text-[16px] font-extrabold tracking-wide leading-tight text-left">Мне тяжело</span>
          <span className="text-3xl drop-shadow-sm ml-1">💔</span>
        </button>
      </section>

      {/* Widgets Section */}
      <section className="w-full z-10 flex flex-col items-center">
        <AIWidget />
        <MomentsFeed />
        <PlansWidget />
      </section>

      {/* Bottom Large CTA */}
      <Link
        href="/game"
        className="w-full z-10 mt-8 mb-4 bg-[#fdfbf9] dark:bg-[#2c2623] text-[#4a403b] dark:text-[#d4c8c1] rounded-[32px] py-5 font-bold shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#e8dfd5] dark:border-[#3d332c] flex items-center justify-center gap-3 active:scale-95 transition-all decoration-transparent"
      >
        <span className="text-xl font-extrabold tracking-tight">Поиграем?</span>
        <span className="text-2xl drop-shadow-md pb-1">🧩</span>
      </Link>

    </main>
  );
}
