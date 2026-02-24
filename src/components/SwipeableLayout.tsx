"use client";

import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { useRouter, usePathname } from 'next/navigation';

const ROUTES = [
    '/',
    '/plans',
    '/wishlist',
    '/gallery',
    '/settings'
];

export default function SwipeableLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            const currentIndex = ROUTES.indexOf(pathname);
            if (currentIndex !== -1 && currentIndex < ROUTES.length - 1) {
                router.push(ROUTES[currentIndex + 1]);
            }
        },
        onSwipedRight: () => {
            const currentIndex = ROUTES.indexOf(pathname);
            if (currentIndex !== -1 && currentIndex > 0) {
                router.push(ROUTES[currentIndex - 1]);
            }
        },
        preventScrollOnSwipe: false,
        trackMouse: false // Only touch events
    });

    return (
        <div {...handlers} className="w-full min-h-screen">
            {children}
        </div>
    );
}
