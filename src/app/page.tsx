"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { sendSignalAction } from '@/app/actions/signals';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import MomentsFeed from '@/components/MomentsFeed';
import PlansWidget from '@/components/PlansWidget';
import AIWidget from '@/components/AIWidget';
import UserStatusWidget from '@/components/UserStatusWidget';
import TimeMachineWidget from '@/components/TimeMachineWidget';
import SurpriseWidget from '@/components/SurpriseWidget';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import { useTheme } from '@/components/ThemeProvider';
import { hapticFeedback } from '@/lib/utils/haptics';

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 22 },
  },
};

const signalCardVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

const SIGNALS = [
  { id: 'miss_you', label: 'Скучаю', emoji: '🧸' },
  { id: 'want_to_talk', label: 'Поговорить', emoji: '💬' },
  { id: 'hugs', label: 'Обнимашки', emoji: '🫂' },
  { id: 'heavy', label: 'Мне тяжело', emoji: '💔' },
];

export default function Home() {
  const [loading, setLoading] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState<string>('сладкий');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    hapticFeedback.light();
    const toastId = toast.loading(`Отправляю: ${label}...`);
    try {
      const res = await sendSignalAction(signalId);
      if (res.error) {
        toast.error(res.error, { id: toastId });
        hapticFeedback.heavy();
      } else {
        toast.success('Сигнал отправлен! ✨', { id: toastId });
        hapticFeedback.success();
      }
    } catch {
      toast.error('Произошла ошибка', { id: toastId });
      hapticFeedback.heavy();
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen pt-12 pb-32 px-5 flex flex-col items-center max-w-sm mx-auto relative overflow-x-hidden text-[#4a403b] dark:text-[#d4c8c1]">
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#fdfbf9', color: '#4a403b', borderRadius: '16px', fontWeight: 'bold' } }} />

      {/* Animated Header */}
      <motion.header
        className="w-full flex justify-between items-center mb-8 px-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2">
          <motion.span
            className="text-2xl drop-shadow-sm"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          >
            ❤️
          </motion.span>
          <h1 className="text-xl font-extrabold tracking-tight">Домик для двоих</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" aria-label="Настройки" className="text-2xl opacity-80 hover:opacity-100 transition-opacity">
            ⚙️
          </Link>
          <button
            aria-label="Переключить тему"
            onClick={() => { hapticFeedback.light(); toggleTheme(); }}
            className="relative w-8 h-8 flex items-center justify-center text-2xl opacity-80 hover:opacity-100 transition-opacity"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme === 'light' ? 'moon' : 'sun'}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="absolute"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </motion.span>
            </AnimatePresence>
          </button>
          <NotificationsDropdown />
        </div>
      </motion.header>

      {/* User status – slides in from right */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
      >
        <UserStatusWidget displayName={displayName} avatarUrl={avatarUrl} />
      </motion.div>

      {/* Signal Grid – staggered cards */}
      <motion.section
        className="grid grid-cols-2 gap-3 w-full z-10 mt-2"
        variants={containerVariants}
        initial="hidden"
        animate={mounted ? 'visible' : 'hidden'}
      >
        {SIGNALS.map(({ id, label, emoji }) => (
          <motion.button
            key={id}
            variants={signalCardVariants}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleSignalClick(id, label)}
            disabled={!!loading}
            className="bg-[#fdfbf9] dark:bg-[#2c2623] text-[#4a403b] dark:text-[#d4c8c1] rounded-[24px] py-4 px-4 font-bold shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e8dfd5] dark:border-[#3d332c] flex items-center justify-between transition-opacity"
            style={{ opacity: loading && loading !== id ? 0.5 : 1 }}
          >
            <span className="text-[16px] font-extrabold tracking-wide leading-tight text-left">{label}</span>
            <motion.span
              className="text-3xl drop-shadow-sm ml-1"
              animate={loading === id ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {emoji}
            </motion.span>
          </motion.button>
        ))}
      </motion.section>

      {/* Widgets – fade up one by one */}
      <motion.section
        className="w-full z-10 flex flex-col items-center mt-4"
        variants={containerVariants}
        initial="hidden"
        animate={mounted ? 'visible' : 'hidden'}
      >
        {[<TimeMachineWidget key="tm" />, <SurpriseWidget key="s" />, <AIWidget key="ai" />, <MomentsFeed key="mf" />, <PlansWidget key="pw" />].map((widget, i) => (
          <motion.div key={i} variants={itemVariants} className="w-full">
            {widget}
          </motion.div>
        ))}
      </motion.section>

      {/* Bottom CTA – spring pop up */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 220, damping: 20 }}
      >
        <Link
          href="/game"
          className="w-full z-10 mt-8 mb-4 bg-[#fdfbf9] dark:bg-[#2c2623] text-[#4a403b] dark:text-[#d4c8c1] rounded-[32px] py-5 font-bold shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#e8dfd5] dark:border-[#3d332c] flex items-center justify-center gap-3 active:scale-95 transition-all decoration-transparent"
        >
          <span className="text-xl font-extrabold tracking-tight">Поиграем?</span>
          <span className="text-2xl drop-shadow-md pb-1">🧩</span>
        </Link>
      </motion.div>
    </main>
  );
}
