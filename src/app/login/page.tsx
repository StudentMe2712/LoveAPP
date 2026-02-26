"use client";

import { useState } from "react";
import { signInWithPasswordAction } from "@/app/actions/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;

        setLoading(true);
        const toastId = toast.loading("Авторизация...");

        try {
            const res = await signInWithPasswordAction(username, password);

            if (res?.error) {
                toast.error(res.error, { id: toastId });
                setLoading(false);
            } else {
                toast.success("Успешный вход! 🏡", { id: toastId });
                window.location.href = "/";
            }
        } catch (err: unknown) {
            console.error("Login failure", err);
            const message =
                typeof err === "object" && err !== null && "message" in err
                    ? String((err as { message?: unknown }).message ?? "")
                    : "";
            toast.error(message || "Произошла непредвиденная ошибка на сервере", { id: toastId });
            setLoading(false);
        }
    };

    return (
        <main className="absolute inset-0 z-[100] flex min-h-[100dvh] w-full flex-col items-center justify-center p-6">
            <div className="flex w-full max-w-sm flex-col items-center rounded-[32px] border-[2px] border-[#e8dfd5] bg-white p-8 text-center shadow-sm dark:border-[#3d332c] dark:bg-[#2d2621]">
                <span className="mb-4 text-6xl drop-shadow-sm">🏡</span>
                <h1 className="mb-2 text-2xl font-extrabold tracking-tight">Наш домик</h1>
                <p className="mb-8 text-sm font-medium opacity-70">Войдите, чтобы оказаться рядом.</p>
                <form onSubmit={handleLogin} className="flex w-full flex-col gap-4">
                    <input
                        type="text"
                        required
                        placeholder="Логин (например, Daulet)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-2xl border-2 border-[#e8dfd5] bg-[#fdfbf9] p-4 text-center font-bold outline-none focus:border-[#cca573] dark:border-[#3d332c] dark:bg-[#1f1a16] dark:focus:border-[#b98b53]"
                    />
                    <input
                        type="password"
                        required
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border-2 border-[#e8dfd5] bg-[#fdfbf9] p-4 text-center font-mono font-bold tracking-wider outline-none focus:border-[#cca573] dark:border-[#3d332c] dark:bg-[#1f1a16] dark:focus:border-[#b98b53]"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-2xl bg-[#cca573] py-4 font-bold text-white shadow-sm transition-all hover:bg-[#b98b53] active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Проверка..." : "Войти в Домик"}
                    </button>
                </form>
            </div>
        </main>
    );
}
