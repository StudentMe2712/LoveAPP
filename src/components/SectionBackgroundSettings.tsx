"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import { compressBackgroundToWebp } from "@/lib/backgrounds/image";
import { BACKGROUND_PRESETS } from "@/lib/backgrounds/presets";
import {
  deleteBackgroundBlob,
  emitSectionBackgroundUpdate,
  readSectionBackgroundState,
  saveBackgroundBlob,
  subscribeSectionBackgroundUpdates,
  writeSectionBackgroundState,
} from "@/lib/backgrounds/storage";
import type {
  SectionBackgroundConfig,
  SectionBackgroundState,
  SectionKey,
} from "@/lib/backgrounds/types";

const SECTION_OPTIONS: Array<{ key: SectionKey; label: string; emoji: string }> = [
  { key: "home", label: "Дом", emoji: "🏠" },
  { key: "wishlist", label: "Вишлист", emoji: "🖤" },
  { key: "gallery", label: "Галерея", emoji: "📷" },
  { key: "game", label: "Игры", emoji: "🎮" },
  { key: "plans", label: "Вместе", emoji: "🗂️" },
  { key: "spicy", label: "Для двоих", emoji: "🔥" },
  { key: "settings", label: "Настройки", emoji: "⚙️" },
  { key: "questions", label: "Вопросы", emoji: "💭" },
  { key: "pair", label: "Пара", emoji: "🔗" },
  { key: "login", label: "Логин", emoji: "🔐" },
];

const DEFAULT_PRESET_ID = BACKGROUND_PRESETS[0]?.id ?? "sunset-road";
const DEFAULT_DIM = 0.2;
const DEFAULT_BLUR = 0;

function createDefaultConfig(): SectionBackgroundConfig {
  return {
    enabled: true,
    source: "preset",
    value: DEFAULT_PRESET_ID,
    dim: DEFAULT_DIM,
    blur: DEFAULT_BLUR,
    updatedAt: Date.now(),
  };
}

export default function SectionBackgroundSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSection, setSelectedSection] = useState<SectionKey>("home");
  const [state, setState] = useState<SectionBackgroundState>(() => readSectionBackgroundState());
  const [uploading, setUploading] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(
    () =>
      subscribeSectionBackgroundUpdates(() => {
        setState(readSectionBackgroundState());
      }),
    [],
  );

  const applyState = useCallback((next: SectionBackgroundState) => {
    stateRef.current = next;
    setState(next);
    writeSectionBackgroundState(next);
    emitSectionBackgroundUpdate();
  }, []);

  const currentConfig = state[selectedSection];
  const activePresetId = currentConfig?.source === "preset" ? currentConfig.value : null;

  const dimValue = currentConfig?.dim ?? DEFAULT_DIM;
  const blurValue = currentConfig?.blur ?? DEFAULT_BLUR;
  const enabled = currentConfig?.enabled ?? false;

  const ensureConfig = useCallback((value: SectionBackgroundConfig | null): SectionBackgroundConfig => {
    if (value) return value;
    return createDefaultConfig();
  }, []);

  const patchCurrent = useCallback(
    (patcher: (current: SectionBackgroundConfig | null) => SectionBackgroundConfig | null) => {
      const nextState: SectionBackgroundState = {
        ...stateRef.current,
        [selectedSection]: patcher(stateRef.current[selectedSection]),
      };
      applyState(nextState);
    },
    [applyState, selectedSection],
  );

  const onToggleEnabled = () => {
    patchCurrent((current) => {
      const base = ensureConfig(current);
      return { ...base, enabled: !base.enabled, updatedAt: Date.now() };
    });
  };

  const onSelectPreset = (presetId: string) => {
    const previous = stateRef.current[selectedSection];
    if (previous?.source === "upload" && previous.value) {
      void deleteBackgroundBlob(previous.value);
    }
    patchCurrent((current) => {
      const base = ensureConfig(current);
      return {
        ...base,
        enabled: true,
        source: "preset",
        value: presetId,
        updatedAt: Date.now(),
      };
    });
  };

  const onDimChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    patchCurrent((current) => {
      const base = ensureConfig(current);
      return { ...base, enabled: true, dim: value, updatedAt: Date.now() };
    });
  };

  const onBlurChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    patchCurrent((current) => {
      const base = ensureConfig(current);
      return { ...base, enabled: true, blur: value, updatedAt: Date.now() };
    });
  };

  const onResetSection = async () => {
    const previous = stateRef.current[selectedSection];
    if (previous?.source === "upload" && previous.value) {
      await deleteBackgroundBlob(previous.value);
    }
    patchCurrent(() => null);
    toast.success("Фон раздела сброшен");
  };

  const onUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const blob = await compressBackgroundToWebp(file);
      const blobId = await saveBackgroundBlob(blob);

      const previous = stateRef.current[selectedSection];
      if (previous?.source === "upload" && previous.value) {
        await deleteBackgroundBlob(previous.value);
      }

      patchCurrent((current) => {
        const base = ensureConfig(current);
        return {
          ...base,
          enabled: true,
          source: "upload",
          value: blobId,
          updatedAt: Date.now(),
        };
      });

      toast.success("Фон загружен и применён");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить фон";
      toast.error(message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const selectedLabel = useMemo(
    () => SECTION_OPTIONS.find((item) => item.key === selectedSection)?.label ?? selectedSection,
    [selectedSection],
  );

  return (
    <Card
      className="mb-4 w-full max-w-md rounded-[32px] border-2 p-6 shadow-sm"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="mb-4">
        <h3 className="text-base font-extrabold">Фоны по разделам</h3>
        <p className="mt-1 text-xs font-medium opacity-70">
          Для каждого раздела свой фон отдельно. Раздел «Наш путь» не участвует и остаётся фиксированным.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {SECTION_OPTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setSelectedSection(section.key)}
            className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${
              selectedSection === section.key
                ? "border-[#cca573] bg-[#cca573]/20"
                : "border-[var(--border)] bg-[color:var(--bg-muted)]"
            }`}
          >
            <span className="mr-1">{section.emoji}</span>
            {section.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[color:var(--bg-muted)] px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider opacity-70">Раздел: {selectedLabel}</p>
          <p className="mt-1 text-xs opacity-60">{enabled ? "Фон включён" : "Фон выключен"}</p>
        </div>
        <button
          type="button"
          onClick={onToggleEnabled}
          className={`relative h-6 w-12 rounded-full transition-colors ${enabled ? "bg-[#cca573]" : "bg-[var(--border)]"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <p className="mb-2 text-xs font-black uppercase tracking-wider opacity-60">Пресеты</p>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {BACKGROUND_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelectPreset(preset.id)}
            className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${
              activePresetId === preset.id
                ? "border-[#cca573] ring-2 ring-[#cca573]/40"
                : "border-[var(--border)]"
            }`}
          >
            <span
              className="block h-14 w-full bg-cover bg-center"
              style={{ backgroundImage: `url("${preset.preview}")` }}
            />
            <span className="block px-2 py-1.5 text-xs font-bold">{preset.label}</span>
            {activePresetId === preset.id && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-[#cca573] px-1.5 py-0.5 text-[10px] font-black text-white">
                ON
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploading}
          className="flex-1 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-muted)] px-3 py-2 text-sm font-bold transition-colors hover:border-[#cca573] disabled:opacity-60"
        >
          {uploading ? "Сжимаю..." : "Загрузить свой фон"}
        </button>
        <button
          type="button"
          onClick={() => void onResetSection()}
          className="rounded-2xl border border-red-300 px-3 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Сброс
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onUploadFile(event)}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider opacity-70">
          Затемнение: {Math.round(dimValue * 100)}%
          <input
            type="range"
            min={0}
            max={0.55}
            step={0.01}
            value={dimValue}
            onChange={onDimChange}
            className="mt-2 w-full"
          />
        </label>

        <label className="block text-xs font-bold uppercase tracking-wider opacity-70">
          Размытие: {blurValue.toFixed(1)}px
          <input
            type="range"
            min={0}
            max={6}
            step={0.1}
            value={blurValue}
            onChange={onBlurChange}
            className="mt-2 w-full"
          />
        </label>
      </div>
    </Card>
  );
}
