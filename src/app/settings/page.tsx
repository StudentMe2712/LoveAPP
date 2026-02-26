"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { exportDataAction, deleteDataAction, updateProfileAvatarAction } from "@/app/actions/settings";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import SectionBackgroundSettings from "@/components/SectionBackgroundSettings";
import ThemePicker from "@/components/ThemePicker";
import { useTheme } from "@/components/ThemeProvider";
import { partnerOrFallback, useResolvedPartnerName } from "@/lib/hooks/useResolvedPartnerName";
import BackButton from "@/components/BackButton";
import Card from "@/components/ui/Card";

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [anniversaryDate, setAnniversaryDate] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [morningEnabled, setMorningEnabled] = useState(false);
    const [morningTime, setMorningTime] = useState("08:00");
    const [inactivityEnabled, setInactivityEnabled] = useState(false);

    const resolvedPartnerName = useResolvedPartnerName();
    const partnerTo = partnerOrFallback(resolvedPartnerName, "партнёру");
    const themedCardStyle = {
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
    } satisfies React.CSSProperties;

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            ),
        [],
    );

    useEffect(() => {
        setMorningEnabled(localStorage.getItem("notif_morning") === "true");
        setMorningTime(localStorage.getItem("notif_morning_time") || "08:00");
        setInactivityEnabled(localStorage.getItem("notif_inactivity") === "true");
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            setUserEmail(user.email || "");
            if (user.user_metadata) {
                setDisplayName(user.user_metadata.display_name || "");
                setAvatarPreview(user.user_metadata.avatar_url || null);
                setAnniversaryDate(user.user_metadata.anniversary_date || "");
            }
        };

        void fetchProfile();
    }, [supabase]);

    const saveNotifSettings = (key: string, val: string) => {
        localStorage.setItem(key, val);
        toast.success("Настройки сохранены ✓", { duration: 1200 });
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Сохраняем профиль...");

        const formData = new FormData();
        formData.append("displayName", displayName);
        formData.append("anniversaryDate", anniversaryDate);

        const file = fileInputRef.current?.files?.[0];
        if (file) formData.append("avatar", file);

        const res = await updateProfileAvatarAction(formData);
        if (res.error) toast.error(res.error, { id: toastId });
        else toast.success("Профиль обновлен! ✨", { id: toastId });

        setLoading(false);
    };

    const handleExport = async () => {
        setLoading(true);
        const toastId = toast.loading("Формируем архив...");
        try {
            const { data, error } = await exportDataAction();
            if (error || !data) {
                toast.error(error || "Ошибка экспорта", { id: toastId });
            } else {
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `nash_domik_export_${new Date().toISOString().split("T")[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Архив скачан!", { id: toastId });
            }
        } catch {
            toast.error("Ошибка при скачивании", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (
            !confirm(
                "Вы уверены? Это навсегда удалит все ваши сообщения, моменты и планы.",
            )
        ) {
            return;
        }

        setLoading(true);
        setIsDeleting(true);
        const toastId = toast.loading("Удаление данных...");

        try {
            const { error, success } = await deleteDataAction();
            if (error) toast.error(error, { id: toastId });
            else if (success) toast.success("Данные успешно удалены", { id: toastId });
        } catch {
            toast.error("Ошибка при удалении", { id: toastId });
        } finally {
            setLoading(false);
            setIsDeleting(false);
        }
    };

    return (
        <main className="app-safe-top app-safe-bottom w-full min-h-[100dvh] flex flex-col items-center px-6">
            <header className="mb-10 flex w-full items-center justify-between">
                <BackButton href="/" />
                <h1 className="text-2xl font-extrabold tracking-tight">Настройки</h1>
                <div className="w-8" />
            </header>

            <PushNotificationToggle />

            <Card className="mb-4 w-full max-w-md rounded-[32px] border-2 p-6" style={themedCardStyle}>
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-widest opacity-50">Mode</p>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="rounded-xl px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors"
                        style={{
                            backgroundColor: "var(--bg-muted)",
                            color: "var(--text)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        {theme === "dark" ? "Dark" : "Light"}
                    </button>
                </div>
                <ThemePicker />
            </Card>

            <SectionBackgroundSettings />

            <section
                className="mb-4 flex w-full max-w-md flex-col gap-5 rounded-[32px] border-2 p-6 shadow-sm"
                style={themedCardStyle}
            >
                <h3 className="text-xs font-black uppercase tracking-widest opacity-50 text-[#4a403b] dark:text-[#d4c8c1]">
                    🔔 Умные уведомления
                </h3>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-[#4a403b] dark:text-[#d4c8c1]">☀️ Утреннее «доброе утро»</p>
                        <p className="mt-0.5 text-xs opacity-50">Push-уведомление каждый день утром</p>
                        {morningEnabled && (
                            <input
                                type="time"
                                value={morningTime}
                                onChange={(e) => {
                                    setMorningTime(e.target.value);
                                    saveNotifSettings("notif_morning_time", e.target.value);
                                }}
                                className="mt-2 rounded-xl border-2 border-[#e8dfd5] bg-[#fdfbf9] p-2 text-sm font-bold text-[#4a403b] outline-none focus:border-[#cca573] dark:border-[#3d332c] dark:bg-[#1f1a16] dark:text-[#d4c8c1]"
                            />
                        )}
                    </div>
                    <button
                        onClick={() => {
                            const next = !morningEnabled;
                            setMorningEnabled(next);
                            saveNotifSettings("notif_morning", String(next));
                        }}
                        className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${morningEnabled ? "bg-[#cca573]" : "bg-[#e8dfd5] dark:bg-[#3d332c]"}`}
                    >
                        <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                morningEnabled ? "translate-x-6" : "translate-x-0.5"
                            }`}
                        />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-[#4a403b] dark:text-[#d4c8c1]">💌 «Давно не заходил»</p>
                        <p className="mt-0.5 text-xs opacity-50">Напомнит написать {partnerTo}, если давно не был(а)</p>
                    </div>
                    <button
                        onClick={() => {
                            const next = !inactivityEnabled;
                            setInactivityEnabled(next);
                            saveNotifSettings("notif_inactivity", String(next));
                        }}
                        className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${inactivityEnabled ? "bg-[#cca573]" : "bg-[#e8dfd5] dark:bg-[#3d332c]"}`}
                    >
                        <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                inactivityEnabled ? "translate-x-6" : "translate-x-0.5"
                            }`}
                        />
                    </button>
                </div>
            </section>

            <section
                className="flex w-full max-w-md flex-col gap-8 rounded-[32px] border-2 p-6 shadow-sm"
                style={themedCardStyle}
            >
                <div>
                    <h2 className="mb-4 text-lg font-bold">👤 Ваш профиль</h2>
                    <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#e8dfd5] bg-gray-200 text-2xl dark:border-[#3d332c] dark:bg-gray-700"
                            >
                                {avatarPreview ? (
                                    <Image src={avatarPreview} alt="Avatar" width={64} height={64} unoptimized className="h-full w-full object-cover" />
                                ) : (
                                    "📷"
                                )}
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
                                <label className="mb-1 block pl-1 text-xs font-bold uppercase tracking-wider opacity-60">Имя в домике</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Например, Камилла"
                                    className="mb-2 w-full rounded-xl border-2 border-[#e8dfd5] bg-[#fdfbf9] p-3 font-bold outline-none focus:border-[#cca573] dark:border-[#3d332c] dark:bg-[#1f1a16]"
                                />
                                {userEmail && <p className="px-2 text-xs font-medium opacity-50">Вы вошли как: {userEmail}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block pl-1 text-xs font-bold uppercase tracking-wider opacity-60">
                                Дата начала отношений (для таймера)
                            </label>
                            <input
                                type="date"
                                value={anniversaryDate}
                                onChange={(e) => setAnniversaryDate(e.target.value)}
                                className="w-full rounded-xl border-2 border-[#e8dfd5] bg-[#fdfbf9] p-3 font-bold text-[#4a403b] outline-none focus:border-[#cca573] dark:border-[#3d332c] dark:bg-[#1f1a16] dark:text-[#d4c8c1]"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-2xl bg-[#cca573] py-3 font-bold text-white transition-colors hover:bg-[#b98b53] disabled:opacity-50"
                        >
                            Сохранить изменения
                        </button>
                    </form>
                </div>

                <div className="border-t border-[#e8dfd5] pt-8 dark:border-[#3d332c]">
                    <h2 className="mb-2 text-lg font-bold">📥 Экспорт данных</h2>
                    <p className="mb-4 line-clamp-3 text-sm opacity-70">
                        Вы можете скачать копию всех ваших воспоминаний, планов, вишлиста и отправленных сигналов в формате JSON.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full rounded-2xl bg-[#e8dfd5] py-3 font-bold text-[#4a403b] transition-colors hover:bg-[#d4c8c1] disabled:opacity-50 dark:bg-[#3d332c] dark:text-[#d4c8c1] dark:hover:bg-[#4a403b]"
                    >
                        Скачать архив JSON
                    </button>
                </div>

                <div className="border-t border-[#e8dfd5] pt-8 dark:border-[#3d332c]">
                    <h2 className="mb-2 text-lg font-bold text-red-600 dark:text-red-400">🚨 Опасная зона</h2>
                    <p className="mb-4 text-sm opacity-70 text-red-600/80 dark:text-red-400/80">
                        Удаление данных сотрет все ваши записи навсегда. Восстановить их будет невозможно.
                    </p>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full rounded-2xl border-2 border-red-200 py-3 font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        {isDeleting ? "Удаляем..." : "Удалить мои данные"}
                    </button>
                </div>
            </section>
        </main>
    );
}
