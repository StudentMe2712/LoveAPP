"use client";

import React, { useState, useEffect, useRef } from 'react';
import { exportDataAction, deleteDataAction, updateProfileAvatarAction } from '@/app/actions/settings';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import ThemePicker from '@/components/ThemePicker';
import { useTheme } from '@/components/ThemeProvider';
import { partnerOrFallback, useResolvedPartnerName } from '@/lib/hooks/useResolvedPartnerName';
import BackButton from '@/components/BackButton';

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [anniversaryDate, setAnniversaryDate] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Smart notification settings
    const [morningEnabled, setMorningEnabled] = useState(false);
    const [morningTime, setMorningTime] = useState('08:00');
    const [inactivityEnabled, setInactivityEnabled] = useState(false);
    const resolvedPartnerName = useResolvedPartnerName();
    const partnerTo = partnerOrFallback(resolvedPartnerName, 'партнёру');
    const themedCardStyle = {
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
    } satisfies React.CSSProperties;

    useEffect(() => {
        setMorningEnabled(localStorage.getItem('notif_morning') === 'true');
        setMorningTime(localStorage.getItem('notif_morning_time') || '08:00');
        setInactivityEnabled(localStorage.getItem('notif_inactivity') === 'true');
    }, []);

    const saveNotifSettings = (key: string, val: string) => {
        localStorage.setItem(key, val);
        toast.success('Настройки сохранены ✓', { duration: 1200 });
    };

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || '');
                if (user.user_metadata) {
                    setDisplayName(user.user_metadata.display_name || '');
                    setAvatarPreview(user.user_metadata.avatar_url || null);
                    setAnniversaryDate(user.user_metadata.anniversary_date || '');
                }
            }
        };
        fetchProfile();
    }, [supabase]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Сохраняем профиль...');

        const formData = new FormData();
        formData.append('displayName', displayName);
        formData.append('anniversaryDate', anniversaryDate);
        const file = fileInputRef.current?.files?.[0];
        if (file) {
            formData.append('avatar', file);
        }

        const res = await updateProfileAvatarAction(formData);
        if (res.error) {
            toast.error(res.error, { id: toastId });
        } else {
            toast.success('Профиль обновлен! ✨', { id: toastId });
        }
        setLoading(false);
    };

    const handleExport = async () => {
        setLoading(true);
        const toastId = toast.loading('Формируем архив...');
        try {
            const { data, error } = await exportDataAction();
            if (error || !data) {
                toast.error(error || "Ошибка экспорта", { id: toastId });
            } else {
                // Trigger file download
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nash_domik_export_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast.success('Архив скачан!', { id: toastId });
            }
        } catch (e) {
            toast.error("Ошибка при скачивании", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Вы уверены? Это навсегда удалит все ваши сообщения, моменты и планы.")) {
            return;
        }

        setLoading(true);
        setIsDeleting(true);
        const toastId = toast.loading('Удаление данных...');
        try {
            const { error, success } = await deleteDataAction();
            if (error) {
                toast.error(error, { id: toastId });
            } else if (success) {
                toast.success('Данные успешно удалены', { id: toastId });
                // We could redirect to Auth screen here if we had one
            }
        } catch (e) {
            toast.error("Ошибка при удалении", { id: toastId });
        } finally {
            setLoading(false);
            setIsDeleting(false);
        }
    };

    return (
        <main className="w-full min-h-[100dvh] flex flex-col items-center px-6 pt-12 pb-32">
            <header className="w-full flex justify-between items-center mb-10">
                <BackButton href="/" />
                <h1 className="text-2xl font-extrabold tracking-tight">Настройки</h1>
                <div className="w-8"></div> {/* Spacer for centering */}
            </header>

            <PushNotificationToggle />

            {/* ── Theme Picker ── */}
            <section
                className="w-full max-w-md rounded-[32px] p-6 shadow-sm border-2 mb-4"
                style={themedCardStyle}
            >
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-black uppercase tracking-widest opacity-50">Mode</p>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-muted)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        {theme === 'dark' ? 'Dark' : 'Light'}
                    </button>
                </div>
                <ThemePicker />
            </section>

            {/* ── Smart Notifications ── */}
            <section
                className="w-full max-w-md rounded-[32px] p-6 shadow-sm border-2 mb-4 flex flex-col gap-5"
                style={themedCardStyle}
            >
                <h3 className="text-xs font-black uppercase tracking-widest opacity-50 text-[#4a403b] dark:text-[#d4c8c1]">🔔 Умные уведомления</h3>

                {/* Morning greeting */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="font-bold text-sm text-[#4a403b] dark:text-[#d4c8c1]">☀️ Утреннее «доброе утро»</p>
                        <p className="text-xs opacity-50 mt-0.5">Push-уведомление каждый день утром</p>
                        {morningEnabled && (
                            <input
                                type="time"
                                value={morningTime}
                                onChange={e => {
                                    setMorningTime(e.target.value);
                                    saveNotifSettings('notif_morning_time', e.target.value);
                                }}
                                className="mt-2 p-2 rounded-xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-[#fdfbf9] dark:bg-[#1f1a16] text-sm font-bold outline-none focus:border-[#cca573] text-[#4a403b] dark:text-[#d4c8c1]"
                            />
                        )}
                    </div>
                    <button
                        onClick={() => {
                            const next = !morningEnabled;
                            setMorningEnabled(next);
                            saveNotifSettings('notif_morning', String(next));
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${morningEnabled ? 'bg-[#cca573]' : 'bg-[#e8dfd5] dark:bg-[#3d332c]'
                            }`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${morningEnabled ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                    </button>
                </div>

                {/* Inactivity nudge */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="font-bold text-sm text-[#4a403b] dark:text-[#d4c8c1]">💌 «Давно не заходил»</p>
                        <p className="text-xs opacity-50 mt-0.5">Напомнит написать {partnerTo} если давно не был(а)</p>
                    </div>
                    <button
                        onClick={() => {
                            const next = !inactivityEnabled;
                            setInactivityEnabled(next);
                            saveNotifSettings('notif_inactivity', String(next));
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${inactivityEnabled ? 'bg-[#cca573]' : 'bg-[#e8dfd5] dark:bg-[#3d332c]'
                            }`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${inactivityEnabled ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                    </button>
                </div>
            </section>

            <section
                className="w-full max-w-md rounded-[32px] p-6 shadow-sm border-2 flex flex-col gap-8"
                style={themedCardStyle}
            >
                <div>
                    <h2 className="text-lg font-bold mb-4">👤 Ваш профиль</h2>
                    <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer overflow-hidden border border-[#e8dfd5] dark:border-[#3d332c] flex items-center shrink-0 justify-center text-2xl"
                            >
                                {avatarPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : '📷'}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setAvatarPreview(URL.createObjectURL(file));
                                }}
                            />
                            <div className="flex-1">
                                <label className="text-xs opacity-60 font-bold uppercase tracking-wider pl-1 mb-1 block">Имя в домике</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    placeholder="Например, Камилла"
                                    className="w-full p-3 rounded-xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-[#fdfbf9] dark:bg-[#1f1a16] focus:border-[#cca573] outline-none font-bold mb-2"
                                />
                                {userEmail && <p className="text-xs opacity-50 px-2 font-medium">Вы вошли как: {userEmail}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs opacity-60 font-bold uppercase tracking-wider pl-1 mb-1 block">Дата начала отношений (для таймера)</label>
                            <input
                                type="date"
                                value={anniversaryDate}
                                onChange={e => setAnniversaryDate(e.target.value)}
                                className="w-full p-3 rounded-xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-[#fdfbf9] dark:bg-[#1f1a16] focus:border-[#cca573] outline-none font-bold text-[#4a403b] dark:text-[#d4c8c1]"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold transition-colors disabled:opacity-50"
                        >
                            Сохранить изменения
                        </button>
                    </form>
                </div>

                <div className="border-t border-[#e8dfd5] dark:border-[#3d332c] pt-8">
                    <h2 className="text-lg font-bold mb-2">📥 Экспорт данных</h2>
                    <p className="text-sm opacity-70 mb-4 line-clamp-3">
                        Вы можете скачать копию всех ваших воспоминаний, планов, вишлиста и отправленных сигналов в формате JSON.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full py-3 bg-[#e8dfd5] hover:bg-[#d4c8c1] dark:bg-[#3d332c] dark:hover:bg-[#4a403b] text-[#4a403b] dark:text-[#d4c8c1] rounded-2xl font-bold transition-colors disabled:opacity-50"
                    >
                        Скачать архив JSON
                    </button>
                </div>

                <div className="border-t border-[#e8dfd5] dark:border-[#3d332c] pt-8">
                    <h2 className="text-lg font-bold mb-2 text-red-600 dark:text-red-400">🚨 Опасная зона</h2>
                    <p className="text-sm opacity-70 mb-4 text-red-600/80 dark:text-red-400/80">
                        Удаление данных сотрет все ваши записи навсегда. Восстановить их будет невозможно.
                    </p>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full py-3 border-2 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? 'Удаляем...' : 'Удалить мои данные'}
                    </button>
                </div>
            </section>
        </main>
    );
}
