"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { hapticFeedback } from '@/lib/utils/haptics';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const arr = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
    return arr;
}

/** iOS Safari in browser (not standalone PWA) doesn't support Web Push */
function detectIOSBrowserLimit(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    const isIOS = /iP(hone|ad|od)/.test(ua);
    const isStandalone = (window.navigator as any).standalone === true;
    // iOS 16.4+ supports push only in standalone (installed PWA) mode
    if (isIOS && !isStandalone) return true;
    return false;
}

export default function PushNotificationToggle() {
    const [status, setStatus] = useState<'unknown' | 'unsupported' | 'ios-browser' | 'denied' | 'granted' | 'default'>('unknown');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (detectIOSBrowserLimit()) {
            setStatus('ios-browser');
            return;
        }
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setStatus('unsupported');
            return;
        }
        setStatus(Notification.permission as any);
    }, []);

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !VAPID_PUBLIC) {
            toast.error('Push-уведомления не поддерживаются');
            return;
        }

        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setStatus('denied');
                toast.error('Разрешение отклонено. Разрешите уведомления в настройках браузера.');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC).buffer as ArrayBuffer,
            });

            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: subscription.toJSON() }),
            });

            if (res.ok) {
                setStatus('granted');
                hapticFeedback.success();
                toast.success('Уведомления включены! 🔔 Теперь ты будешь получать их прямо на телефон.');
            } else {
                toast.error('Не удалось сохранить подписку');
            }
        } catch (err) {
            console.error('Push subscribe error:', err);
            toast.error('Ошибка при подключении уведомлений');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) await sub.unsubscribe();

            await fetch('/api/push/subscribe', { method: 'DELETE' });
            setStatus('default');
            toast.success('Уведомления отключены');
        } catch {
            toast.error('Ошибка при отключении');
        } finally {
            setLoading(false);
        }
    };

    // Completely hide if no push support at all (and not iOS)
    if (status === 'unsupported') return null;

    return (
        <div className="w-full bg-[#fdfbf9] dark:bg-[#2c2623] rounded-3xl p-5 border border-[#e8dfd5] dark:border-[#3d332c] flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <span className="text-3xl">🔔</span>
                <div className="flex-1">
                    <h3 className="font-extrabold text-[#4a403b] dark:text-[#d4c8c1]">Уведомления на телефон</h3>
                    <p className="text-xs opacity-50 mt-0.5">
                        {status === 'granted'
                            ? 'Уведомления включены ✅'
                            : status === 'denied'
                                ? 'Заблокировано в браузере ❌'
                                : status === 'ios-browser'
                                    ? 'Установи приложение на экран — появится кнопка ниже'
                                    : 'Получай сигналы прямо в центр уведомлений'}
                    </p>
                </div>
            </div>

            {status === 'ios-browser' ? (
                /* iOS Safari browser — must install as PWA first */
                <div className="bg-[#fff8f0] dark:bg-[#3a2a1a] rounded-2xl p-4 flex flex-col gap-2 border border-[#e8c87a]/40">
                    <p className="text-sm font-bold text-[#7a5c2e] dark:text-[#cca573]">📲 Как включить на iPhone:</p>
                    <ol className="text-xs text-[#7a5c2e] dark:text-[#a38050] font-medium list-decimal list-inside flex flex-col gap-1">
                        <li>Нажми кнопку <strong>«Поделиться»</strong> (квадрат со стрелкой) в Safari</li>
                        <li>Выбери <strong>«На экран «Домой»»</strong></li>
                        <li>Открой приложение с экрана — уведомления станут доступны</li>
                    </ol>
                </div>
            ) : status === 'granted' ? (
                <button
                    onClick={unsubscribe}
                    disabled={loading}
                    className="w-full py-3 rounded-2xl text-sm font-bold border-2 border-[#e3d2b3] dark:border-[#55331a] text-[#cca573] active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? 'Отключаем...' : '🔕 Отключить уведомления'}
                </button>
            ) : (
                <button
                    onClick={subscribeToPush}
                    disabled={loading || status === 'denied'}
                    className="w-full py-3 rounded-2xl text-sm font-bold bg-[#cca573] hover:bg-[#b98b53] text-white active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? 'Подключаем...' : status === 'denied' ? '❌ Разрешите в настройках браузера' : '🔔 Включить уведомления'}
                </button>
            )}
        </div>
    );
}
