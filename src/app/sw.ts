/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST || [],
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Handle incoming web push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data: { title?: string; body?: string; icon?: string; badge?: string; tag?: string; data?: { url?: string } } = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: 'Наш Домик 🏠', body: event.data.text() };
    }

    const title = data.title || 'Наш Домик 🏠';
    const options = {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-72x72.png',
        tag: data.tag || 'nashdomik',
        data: data.data || { url: '/' },
        vibrate: [200, 100, 200],
    } as NotificationOptions;

    event.waitUntil(self.registration.showNotification(title, options));
});

// Open app when user taps notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data as { url?: string })?.url || '/';

    event.waitUntil(
        (self.clients as Clients).matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('navigate' in client) {
                    (client as WindowClient).navigate(url);
                    return (client as WindowClient).focus();
                }
            }
            return (self.clients as Clients).openWindow(url);
        })
    );
});
