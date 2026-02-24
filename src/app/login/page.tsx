"use client";

import { useState } from "react";
import { signInWithPasswordAction } from "@/app/actions/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

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
                window.location.href = '/';
            }
        } catch (err: any) {
            console.error("Login failure", err);
            toast.error(err.message || "Произошла непредвиденная ошибка на сервере", { id: toastId });
            setLoading(false);
        }
    }

    return (
        <main className="w-full min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#f2ebe3] dark:bg-[#1a1614] absolute inset-0 z-[100]">
            <div className="w-full max-w-sm bg-white dark:bg-[#2d2621] rounded-[32px] p-8 shadow-sm border-[2px] border-[#e8dfd5] dark:border-[#3d332c] flex flex-col items-center text-center">
                <span className="text-6xl drop-shadow-sm mb-4">🏡</span>
                <h1 className="text-2xl font-extrabold tracking-tight mb-2">Наш домик</h1>
                <p className="text-sm font-medium opacity-70 mb-8">
                    Войдите, чтобы оказаться рядом.
                </p>
                <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                    <input
                        type="text"
                        required
                        placeholder="Логин (например, Daulet)"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-4 rounded-2xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-[#fdfbf9] dark:bg-[#1f1a16] focus:border-[#cca573] dark:focus:border-[#b98b53] outline-none text-center font-bold"
                    />
                    <input
                        type="password"
                        required
                        placeholder="Пароль"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-4 rounded-2xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-[#fdfbf9] dark:bg-[#1f1a16] focus:border-[#cca573] dark:focus:border-[#b98b53] outline-none text-center font-bold font-mono tracking-wider"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-2 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? "Проверка..." : "Войти в Домик"}
                    </button>
                </form>

            </div>
        </main>
    );
}
