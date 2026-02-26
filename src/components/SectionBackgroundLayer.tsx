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
import type { SectionBackgroundConfig } from "@/lib/backgrounds/types";

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
    setConfig(sectionConfig && sectionConfig.enabled ? sectionConfig : null);

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

  if (!sectionKey || !config || !config.enabled) return null;

  const source =
    config.source === "preset"
      ? BACKGROUND_PRESET_MAP[config.value]?.src ?? null
      : uploadSrc;

  if (!source) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${source}")`,
          filter: config.blur > 0 ? `blur(${config.blur}px)` : undefined,
          transform: config.blur > 0 ? "scale(1.02)" : undefined,
        }}
      />
      {config.dim > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(14, 10, 16, ${config.dim})` }}
        />
      )}
    </div>
  );
}
