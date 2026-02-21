"use client";

import { useState } from "react";
import { signInWithEmailAction } from "@/app/actions/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        const toastId = toast.loading("Отправляем волшебную ссылку...");

        const res = await signInWithEmailAction(email);

        if (res?.error) {
            toast.error(res.error, { id: toastId });
            setLoading(false);
        } else {
            toast.success("Всё готово! Открывайте почту 💌", { id: toastId, duration: 5000 });
            setSent(true);
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

                {sent ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <span className="text-4xl mb-4">💌</span>
                        <p className="font-bold text-[#b98b53] mb-2">Ссылка отправлена!</p>
                        <p className="text-sm opacity-80">Перейдите по ссылке из письма, чтобы войти в домик.</p>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                        <input
                            type="email"
                            required
                            placeholder="Ваш Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-4 rounded-2xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-[#fdfbf9] dark:bg-[#1f1a16] focus:border-[#cca573] dark:focus:border-[#b98b53] outline-none text-center font-bold"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? "Отправка..." : "Войти по ссылке"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
