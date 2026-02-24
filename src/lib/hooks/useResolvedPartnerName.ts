"use client";

import { useEffect, useMemo, useState } from "react";

export const PARTNER_FALLBACK_NAME = "Партнёр";

let cachedPartnerName: string | null | undefined;
let partnerNamePromise: Promise<string | null> | null = null;

async function fetchPartnerNameOnce() {
    if (cachedPartnerName !== undefined) {
        return cachedPartnerName;
    }

    if (!partnerNamePromise) {
        partnerNamePromise = import("@/app/actions/status")
            .then(async ({ getPartnerNameAction }) => {
                const res = await getPartnerNameAction();
                const rawName = typeof res.name === "string" ? res.name.trim() : "";
                cachedPartnerName = rawName.length > 0 ? rawName : null;
                return cachedPartnerName;
            })
            .catch(() => {
                cachedPartnerName = null;
                return null;
            });
    }

    return partnerNamePromise;
}

export function useResolvedPartnerName(initialName?: string | null) {
    const normalizedInitialName = useMemo(() => {
        if (typeof initialName !== "string") return null;
        const trimmed = initialName.trim();
        return trimmed.length > 0 ? trimmed : null;
    }, [initialName]);

    const [fetchedPartnerName, setFetchedPartnerName] = useState<string | null | undefined>(cachedPartnerName);

    useEffect(() => {
        if (normalizedInitialName) {
            cachedPartnerName = normalizedInitialName;
            return;
        }

        let isMounted = true;
        fetchPartnerNameOnce().then((name) => {
            if (!isMounted) return;
            setFetchedPartnerName(name);
        });

        return () => {
            isMounted = false;
        };
    }, [normalizedInitialName]);

    return normalizedInitialName ?? fetchedPartnerName ?? PARTNER_FALLBACK_NAME;
}

export function partnerOrFallback(resolvedPartnerName: string, fallbackText: string) {
    return resolvedPartnerName === PARTNER_FALLBACK_NAME ? fallbackText : resolvedPartnerName;
}
