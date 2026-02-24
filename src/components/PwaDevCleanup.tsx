"use client";

import { useEffect } from "react";

declare global {
    interface Window {
        serwist?: {
            register: () => Promise<unknown>;
        };
    }
}

export default function PwaDevCleanup() {
    useEffect(() => {
        const isTunnelHost = typeof window !== "undefined" && window.location.hostname.endsWith("trycloudflare.com");
        const isProduction = process.env.NODE_ENV === "production";
        const shouldDisableSw = !isProduction || isTunnelHost;
        const cleanupKey = "__sw_cleanup_v3_done__";

        const cleanup = async (): Promise<boolean> => {
            let touched = false;

            try {
                if ("serviceWorker" in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    if (registrations.length > 0) {
                        touched = true;
                        await Promise.all(registrations.map((registration) => registration.unregister()));
                    }
                }

                if ("caches" in window) {
                    const cacheNames = await caches.keys();
                    if (cacheNames.length > 0) {
                        touched = true;
                        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
                    }
                }
            } catch (error) {
                console.warn("PWA dev cleanup failed", error);
            }

            return touched;
        };

        const bootstrap = async () => {
            if (shouldDisableSw) {
                if (localStorage.getItem(cleanupKey) === "1") return;

                const changed = await cleanup();
                localStorage.setItem(cleanupKey, "1");
                if (changed) window.location.reload();
                return;
            }

            if (typeof window !== "undefined" && window.serwist?.register) {
                void window.serwist.register();
            }
        };

        void bootstrap();
    }, []);

    return null;
}
