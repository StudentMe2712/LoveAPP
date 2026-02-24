# Changelog (Agent)

## 0.1.0 — 2026-02-21
- Initial spec docs and marathon gates scaffolding (docs/agent + scripts)
- [T0001] Created Next.js + TypeScript + Tailwind project skeleton in root
- [T0001] Added @serwist/next for PWA support and created app/manifest.ts and app/sw.ts
- [T0002] Initialized Supabase locally and added init_schema migration including auth.users RLS pair isolation policies
- [T0003] Implemented Notification Router, Telegram Bot API send function, and webhook callback endpoint.
- [T0004] Validated QA gates logic and execution with basic dummy tests.
- [T0101] Implemented Home screen with 4 interactive cozy signal buttons and light/dark mode support
- [T0102] Configured Supabase SSR client, implemented Signal server action with anti-spam, wired Home SC to React Hot Toast notifications
- [T0103] Implemented Realtime Moments Feed and Uploader components. Created Supabase Storage bucket 'moments'.
- [T0104] Seeded reply templates DB and integrated randomized replies into Telegram webhook inline buttons.
- [T0201] Built Question Packs UI, implemented submitAnswerAction, and optionally save answers to Memory Vault
- [T0202] Added Wishlist UI, Supabase SQL migration, and Server Actions for hint mode and tagging.
- [T0203] Implemented Shared Plans module with time slots picking and integrated Telegram Reminders.

## 0.1.1 — 2026-02-24
- [UX] Wishlist: delete now updates UI instantly without page reload (optimistic remove + rollback on error + per-item pending state).
- [UX] Partner name in UI: added shared `useResolvedPartnerName` hook (profiles.display_name via `getPartnerNameAction`, fallback `Партнёр`) and replaced static partner labels in listed UI pages/components.
- [UX] Gallery: after successful caption save in lightbox, modal now closes and returns to gallery grid; on error it stays open.
- [UX] Swipe navigation: fixed deterministic tab order `/ -> /wishlist -> /journey -> /plans -> /spicy`, disabled swipe route changes on non-tab pages, increased gesture strictness to avoid random diagonal/short swipe transitions.

## 0.1.2 — 2026-02-24
- [Infra] Aligned runtime ports with tunnel origin: `npm run dev` and `npm run start` now run on `3001`.
- [PWA] Disabled Serwist outside production and added a dev-only cleanup component that unregisters stale SW registrations and clears caches.
- [DB] Added `public.profiles` migration with RLS, backfill from `auth.users` metadata, and auth trigger-based synchronization.
- [Profile] `updateProfileAvatarAction` now requires an authenticated user and upserts `public.profiles` after auth metadata updates.
- [Wishlist] Stabilized browser Supabase client, extracted stable `fetchItems`, and implemented optimistic create+rollback (with replacement by inserted row on success).
- [Docs] Added troubleshooting notes for stale SW cache in tunnel/dev mode.

## 0.1.3 — 2026-02-24
- [Theme] Synchronized palette application with light/dark mode in `ThemeProvider` and hardened palette restoration from `localStorage`.
- [Theme] Settings now include a direct light/dark mode toggle near palette picker; settings cards and bottom nav use palette CSS variables for immediate visual feedback.
- [Time Machine] Reworked `getTimeMachineMomentAction` to return an interleaved list across senders (not a single random item), then show as slideshow in `TimeMachineWidget`.

## 0.1.4 — 2026-02-24
- [PWA] Disabled automatic Service Worker registration (`register: false`) and moved registration control to runtime component logic.
- [PWA] `PwaDevCleanup` now enforces one-time SW/cache cleanup on dev and `*.trycloudflare.com`, then prevents re-registration there.
- [PWA] Service Worker is now registered only in production on non-tunnel hosts, eliminating recurring tunnel precache 404 loops after rebuilds.

## 0.1.5 — 2026-02-24
- [Journey] Full visual redesign of `/journey` to match the provided reference style (sunset sky, glowing horizon, curved road scene, cinematic timer composition, glowing heart focus).
- [Journey] Kept live relationship timer logic from `anniversary_date` with graceful fallback state when the date is missing.
- [Journey] Replaced old anti-stress clicker layout with a single immersive hero composition optimized for mobile and desktop.

## 0.1.6 — 2026-02-24
- [Journey] Reworked `/journey` to use a direct full-screen PNG background (`/journey-bg.png`) with timer/title/heart composition aligned to the provided reference.
- [Journey] Removed interactive heart-clicker mechanics from this screen and kept a decorative glowing heart focus element.
- [Nav] `BottomNav` is now hidden on `/journey` so the hero composition is not obstructed.
- [Journey] Switched background source to a bundled static import (`src/assets/journey-bg.png`) with `unoptimized` rendering to avoid `/_next/image` 400 errors on this asset.
- [Journey] Tightened mobile timer typography/spacing to prevent wrapping and clipping on narrow screens.
- [Journey] Aligned headline typography to reference: `Наш Путь ❤️🙌` and `МЫ ВМЕСТЕ УЖЕ` now use dedicated title/subtitle styling and spacing.
- [Journey] Finalized exact heading text composition to match reference: `Наш Путь ❤️🙌` (single emoji block) and `МЫ ВМЕСТЕ УЖЕ`.
- [Journey] Restored anti-stress heart mechanics on `/journey`: tap combo, floating rewards ("плюшки"), and an auto-click mode with turbo upgrades.
- [Journey] Moved the interactive heart from bottom position to the upper road focus area to match the new `journey-bg` composition without embedded heart.
- [Journey] Tuned hero typography to blend with background: reduced size/contrast for `Наш Путь`, `МЫ ВМЕСТЕ УЖЕ`, and timer digits/labels for a softer cinematic look.
