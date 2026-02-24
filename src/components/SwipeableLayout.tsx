"use client";

import React from 'react';
import { SwipeEventData, useSwipeable } from 'react-swipeable';
import { useRouter, usePathname } from 'next/navigation';

const ROUTES = [
    '/',
    '/wishlist',
    '/journey',
    '/plans',
    '/spicy',
];

export default function SwipeableLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const currentIndex = ROUTES.indexOf(pathname);
    const isSwipeEnabled = currentIndex !== -1;

    const shouldHandleSwipe = (eventData: SwipeEventData) => {
        if (!isSwipeEnabled) return false;
        if (eventData.absX < 64) return false;
        return eventData.absX > eventData.absY * 1.35;
    };

    const handlers = useSwipeable({
        onSwipedLeft: (eventData) => {
            if (!shouldHandleSwipe(eventData)) return;
            if (currentIndex < ROUTES.length - 1) {
                router.push(ROUTES[currentIndex + 1]);
            }
        },
        onSwipedRight: (eventData) => {
            if (!shouldHandleSwipe(eventData)) return;
            if (currentIndex > 0) {
                router.push(ROUTES[currentIndex - 1]);
            }
        },
        delta: 28,
        preventScrollOnSwipe: false,
        trackMouse: false // Only touch events
    });

    return (
        <div {...(isSwipeEnabled ? handlers : {})} className="w-full min-h-screen">
            {children}
        </div>
    );
}
