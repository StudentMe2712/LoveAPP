"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BACKGROUND_PRESET_MAP } from "@/lib/backgrounds/presets";
import { resolveSectionKey } from "@/lib/backgrounds/route";
import {
  readBackgroundBlob,
  readSectionBackgroundState,
  subscribeSectionBackgroundUpdates,
} from "@/lib/backgrounds/storage";
import type { SectionBackgroundConfig, SectionKey } from "@/lib/backgrounds/types";

const DEFAULT_SECTION_PRESET: Partial<Record<SectionKey, string>> = {
  home: "rose-dream",
  chat: "coffee-cozy",
  settings: "mint-garden",
};

const DEFAULT_FALLBACK_DIM = 0.16;

export default function SectionBackgroundLayer() {
  const pathname = usePathname();
  const sectionKey = useMemo(() => resolveSectionKey(pathname), [pathname]);
  const objectUrlRef = useRef<string | null>(null);
  const [config, setConfig] = useState<SectionBackgroundConfig | null>(null);
  const [uploadSrc, setUploadSrc] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    if (!sectionKey) {
      setConfig(null);
      setUploadSrc(null);
      return;
    }

    const state = readSectionBackgroundState();
    const sectionConfig = state[sectionKey];
    setConfig(sectionConfig ?? null);

    if (!sectionConfig || !sectionConfig.enabled || sectionConfig.source !== "upload") {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setUploadSrc(null);
      return;
    }

    const blob = await readBackgroundBlob(sectionConfig.value);
    if (!blob) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setUploadSrc(null);
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    objectUrlRef.current = URL.createObjectURL(blob);
    setUploadSrc(objectUrlRef.current);
  }, [sectionKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadConfig();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadConfig]);

  useEffect(
    () =>
      subscribeSectionBackgroundUpdates(() => {
        void loadConfig();
      }),
    [loadConfig],
  );

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    },
    [],
  );

  if (!sectionKey) return null;

  const fallbackPresetId = DEFAULT_SECTION_PRESET[sectionKey] ?? null;
  const fallbackSource = fallbackPresetId ? BACKGROUND_PRESET_MAP[fallbackPresetId]?.src ?? null : null;

  const effectiveConfig: SectionBackgroundConfig | null =
    config?.enabled
      ? config
      : config === null && fallbackSource
        ? {
            enabled: true,
            source: "preset",
            value: fallbackPresetId as string,
            dim: DEFAULT_FALLBACK_DIM,
            blur: 0,
            updatedAt: 0,
          }
        : null;

  if (!effectiveConfig || !effectiveConfig.enabled) return null;

  const source =
    effectiveConfig.source === "preset"
      ? BACKGROUND_PRESET_MAP[effectiveConfig.value]?.src ?? null
      : uploadSrc;

  const resolvedSource = source ?? fallbackSource;

  if (!resolvedSource) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${resolvedSource}")`,
          filter: effectiveConfig.blur > 0 ? `blur(${effectiveConfig.blur}px)` : undefined,
          transform: effectiveConfig.blur > 0 ? "scale(1.02)" : undefined,
        }}
      />
      {effectiveConfig.dim > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(14, 10, 16, ${effectiveConfig.dim})` }}
        />
      )}
    </div>
  );
}
