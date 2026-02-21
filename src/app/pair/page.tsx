"use client";

import { useState, useEffect } from "react";
import { checkPairAction, joinPairAction, signOutAction } from "@/app/actions/auth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function PairPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [myId, setMyId] = useState("");
    const [partnerCode, setPartnerCode] = useState("");

    useEffect(() => {
        const checkStatus = async () => {
            const res = await checkPairAction();
            if (res.requireLogin) {
                router.replace('/login');
            } else if (res.success && res.pair) {
                router.replace('/'); // Already in a pair
            } else if (res.requirePair) {
                setMyId(res.userId || "");
                setLoading(false);
            }
        };
        checkStatus();
    }, [router]);

    const handleCopy = () => {
        navigator.clipboard.writeText(myId);
        toast.success("Ваш код скопирован!");
    };

    const handleJoinClick = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partnerCode.trim()) return;

        setActionLoading(true);
        const toastId = toast.loading("Связываю сердца...");

        const res = await joinPairAction(partnerCode.trim());
        if (res?.error) {
            toast.error(res.error, { id: toastId });
            setActionLoading(false);
        } else {
            toast.success("Домик построен! 🎉", { id: toastId });
            router.replace('/');
        }
    };

    if (loading) {
        return <div className="w-full h-[100dvh] flex items-center justify-center bg-[#f2ebe3] dark:bg-[#1a1614] absolute inset-0 z-[100]"><div className="animate-pulse text-4xl">❤️</div></div>;
    }

    return (
        <main className="w-full min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#f2ebe3] dark:bg-[#1a1614] absolute inset-0 z-[100]">
            <div className="w-full max-w-sm bg-white dark:bg-[#2d2621] rounded-[32px] p-8 shadow-sm border-[2px] border-[#e8dfd5] dark:border-[#3d332c] flex flex-col items-center text-center">
                <span className="text-5xl drop-shadow-sm mb-4">🔑</span>
                <h1 className="text-2xl font-extrabold tracking-tight mb-2">Создать Пару</h1>
                <p className="text-sm font-medium opacity-70 mb-8">
                    Чтобы пользоваться домиком, вам нужно соединиться с партнером.
                </p>

                <div className="w-full bg-[#fdfbf9] dark:bg-[#1f1a16] p-4 rounded-2xl border border-[#e8dfd5] dark:border-[#3d332c] mb-8">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Ваш личный код:</p>
                    <p className="text-lg font-mono font-bold mb-3 select-all break-all">{myId}</p>
                    <button
                        onClick={handleCopy}
                        className="text-xs font-bold px-4 py-2 bg-[#e8dfd5] dark:bg-[#3d332c] hover:bg-[#d4c8c1] dark:hover:bg-[#4a403b] rounded-full transition-colors"
                    >
                        📋 Скопировать код
                    </button>
                    <p className="text-xs opacity-60 mt-4 leading-tight">
                        Отправьте этот код партнеру, если он сейчас вводит код ниже.
                    </p>
                </div>

                <form onSubmit={handleJoinClick} className="w-full flex flex-col gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50 self-start ml-1">Или введите код партнера:</p>
                    <input
                        type="text"
                        required
                        placeholder="Код партнера..."
                        value={partnerCode}
                        onChange={e => setPartnerCode(e.target.value)}
                        className="w-full p-4 rounded-2xl border-2 border-[#e8dfd5] dark:border-[#3d332c] bg-[#fdfbf9] dark:bg-[#1f1a16] focus:border-[#cca573] dark:focus:border-[#b98b53] outline-none font-mono text-center"
                    />
                    <button
                        type="submit"
                        disabled={actionLoading || !partnerCode.trim()}
                        className="w-full mt-2 py-4 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                        {actionLoading ? "Проверка..." : "Соединить"}
                    </button>
                </form>

                <button
                    onClick={() => signOutAction()}
                    className="mt-8 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity underline underline-offset-2"
                >
                    Выйти из аккаунта
                </button>
            </div>
        </main>
    );
}
