export const SECTION_KEYS = [
  "home",
  "chat",
  "wishlist",
  "gallery",
  "game",
  "plans",
  "spicy",
  "settings",
  "questions",
  "pair",
  "login",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionBackgroundSource = "preset" | "upload";

export type SectionBackgroundConfig = {
  enabled: boolean;
  source: SectionBackgroundSource;
  value: string;
  dim: number;
  blur: number;
  updatedAt: number;
};

export type SectionBackgroundState = Record<SectionKey, SectionBackgroundConfig | null>;

export const SECTION_BACKGROUND_STORAGE_KEY = "nd.section_backgrounds.v1";

export const SECTION_BACKGROUND_EVENT = "nd:section-bg:update";

export function createEmptySectionBackgroundState(): SectionBackgroundState {
  const state = {} as SectionBackgroundState;
  for (const key of SECTION_KEYS) {
    state[key] = null;
  }
  return state;
}
