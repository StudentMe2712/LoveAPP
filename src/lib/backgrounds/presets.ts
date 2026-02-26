export type BackgroundPreset = {
  id: string;
  label: string;
  src: string;
  preview: string;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: "sunset-road", label: "Закат", src: "/backgrounds/sunset-road.svg", preview: "/backgrounds/sunset-road.svg" },
  { id: "morning-sky", label: "Утро", src: "/backgrounds/morning-sky.svg", preview: "/backgrounds/morning-sky.svg" },
  { id: "lavender-night", label: "Ночь", src: "/backgrounds/lavender-night.svg", preview: "/backgrounds/lavender-night.svg" },
  { id: "mint-garden", label: "Сад", src: "/backgrounds/mint-garden.svg", preview: "/backgrounds/mint-garden.svg" },
  { id: "rose-dream", label: "Розы", src: "/backgrounds/rose-dream.svg", preview: "/backgrounds/rose-dream.svg" },
  { id: "ocean-breeze", label: "Море", src: "/backgrounds/ocean-breeze.svg", preview: "/backgrounds/ocean-breeze.svg" },
  { id: "coffee-cozy", label: "Кофе", src: "/backgrounds/coffee-cozy.svg", preview: "/backgrounds/coffee-cozy.svg" },
  { id: "aurora-glow", label: "Аврора", src: "/backgrounds/aurora-glow.svg", preview: "/backgrounds/aurora-glow.svg" },
];

export const BACKGROUND_PRESET_MAP = BACKGROUND_PRESETS.reduce<Record<string, BackgroundPreset>>(
  (acc, preset) => {
    acc[preset.id] = preset;
    return acc;
  },
  {},
);
