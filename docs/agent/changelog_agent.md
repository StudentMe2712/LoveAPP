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
- [Journey] Switched background source to `public/journey-bg.png` so manual file replacement is reflected on the page without syncing `src/assets`.
- [Infra] Added no-cache headers for `/journey-bg.png` to reduce stale background issues behind tunnel/browser caches.
- [Journey] Removed the visible heart stats/control panel on `/journey` while keeping the auto-clicker and turbo progression logic running in the background.
- [Journey] Adjusted heart anchor position upward to align with the previous upper-heart spot in the road composition.
- [Journey] Restored rich click feedback on the heart: confetti bursts, periodic WOW/firework effects, and extra floating rewards on combo milestones.
- [Nav] Re-enabled `BottomNav` visibility on `/journey`.
- [Journey] Raised the interactive heart position higher on the road to match the updated visual target area.
- [UI] Added a unified `BackButton` component and replaced page-level back controls across Gallery, Journey, Game, Quiz, Memory, Settings, and Spicy screens.
- [Journey] Replaced emoji heart glyph rendering with inline SVG heart to fix missing heart on older iOS devices (including iPhone 7+ class devices).
- [Journey] Moved the heart anchor higher again on desktop/mobile breakpoints to match the requested road position.
- [Quiz AI] Fixed client crash when AI returns object-shaped question fields (e.g. localized keys like `{вопрос: ...}`): server/client now normalize AI suggestions to safe strings before rendering.

## 0.1.7 — 2026-02-25
- [Infra] Hardened `qa_gate.ps1` to strict fail-fast with reliable exit-code handling for docs/lint/test/build.
- [Infra] Migrated auth edge entry from deprecated `middleware.ts` to `proxy.ts` with the same matcher behavior.
- [Quality] Reduced frontend lint issues to `0 errors` and `7 warnings`; fixed hook cascade issues in `ThemeProvider`, `Journey`, `Memory`, and `UserStatusWidget`.
- [UI] Added shared GUI primitives (`Card`, `Button`, `Field`, `StateBlock`) and introduced global UI tokens for spacing/radius/shadows/text scale.
- [UI] Unified `BackButton` style across internal screens with consistent touch-target sizing.
- [Journey] Improved mobile reliability: heart anchor now uses bottom+safe-area positioning, reducing disappearance on compact iPhone viewports.
- [Mobile] Added safe-area helpers and applied them on key routes (`/wishlist`, `/gallery`, `/game/quiz`, `/settings`), plus bottom-nav safe-area padding.
- [UX] Tightened swipe gesture filtering in `SwipeableLayout` to reduce accidental diagonal route switches.

## 0.1.8 - 2026-02-25
- [Encoding] Fixed remaining UTF-8/mojibake UI texts on `/gallery` (title, filters, actions, placeholders, toasts, favorite icons).
- [Encoding] Fixed remaining UTF-8/mojibake UI texts on `/game/quiz` (tabs, headings, hints, AI labels, result states, and status copy).
- [Stability] Verified both screens after text rewrites: `npm run -s lint` (0 errors, warnings only) and `npm run -s build` successful.

## 0.1.9 - 2026-02-25
- [Avatar] Fixed partner avatar rendering in `UserStatusWidget`: right-side avatar now loads from `profiles.avatar_url` by `partnerId` instead of reusing the current user's avatar.
- [Status API] Extended `getUserStatusesAction` response with `partnerAvatarUrl` for reliable partner UI sync after avatar changes.

## 0.1.10 - 2026-02-25
- [Infra] Integrated optional Upstash Redis client with feature flags (`REDIS_ENABLED`, `REDIS_RATE_LIMIT_SIGNALS`, `REDIS_CACHE_AI`) and graceful fallback behavior.
- [Signals] Replaced process-local anti-spam gate with Redis-backed 60s rate limit (`SET NX EX` + `TTL`), while preserving fallback flow when Redis is unavailable.
- [AI] Added Redis cache for quiz question generation (TTL 30m) and spicy generation endpoint (TTL 15m) with structured `redis=hit|miss|fallback` logs.

## 0.1.11 - 2026-02-26
- [Backgrounds] Added per-section background system for all key routes except `/journey` (which remains fixed by design).
- [Backgrounds] Implemented route-to-section mapping, local storage contract (`nd.section_backgrounds.v1`), and uploaded image blob storage in IndexedDB (`nash_domik_assets/section_backgrounds`).
- [Settings] Added a new "Фоны по разделам" block with section selector, 8 presets, custom upload, dim/blur controls, and reset action.
- [UI] Added global background rendering layer behind GUI with per-section isolation and no pointer interaction conflicts.
- [UI] Removed hardcoded root background fills on `plans`, `gallery`, `login`, `pair`, and spicy root containers so section backgrounds can be visible.
- [PWA] Hardened stale-cache protection for local production runs: Service Worker cleanup/disable now applies on `localhost` and `127.0.0.1` (in addition to tunnel), preventing recurring `bad-precaching-response` and chunk 404 loops after rebuilds.

## 0.1.12 - 2026-02-26
- [Chat] Added new `/chat` page for pair-only realtime text chat (messages, typing indicator, read status with single/double checks, optimistic send + rollback).
- [Chat] Added chat server actions: bootstrap (last 50 + pagination), send message, mark read, and contextual AI advice with partner-name substitution.
- [Chat] Chat header now resolves partner avatar/name from `profiles` and shows online state based on `user_statuses.updated_at`.
- [Nav] Added `Чат` tab to bottom navigation and updated swipe order to `/ -> /chat -> /wishlist -> /journey -> /plans -> /spicy`.
- [Backgrounds] Extended section background system with `chat` key and settings selector option so chat can use its own background independently.
- [DB] Added migration `20260226120000_chat_messages.sql` with RLS pair isolation, indexes, read-only update guard for `read_at`, and realtime publication for `chat_messages`.

## 0.1.13 - 2026-02-26
- [Presence] Added `public.user_presence` with RLS + realtime and implemented heartbeat endpoint `POST /api/presence/ping` (visible app sends pings every 30s).
- [Chat] Extended `chat_messages` for media (`image`, `voice`, `video_note`) with validation constraints and immutable payload updates (only `read_at` is mutable).
- [Chat] Added `POST /api/chat/media` with size/duration limits, optimistic UI integration, and compensation rollback on failed post-save steps.
- [Media] Added shared filesystem storage helper and `GET /api/media/[filename]` serving route (shared directory: `\\itskom\\Y\\Даулет\\images`).
- [Gallery Sync] Chat image messages now auto-create `moments` records with empty caption (`null`) so images appear in `/gallery`.
- [Plans] Implemented instant `/plans` UX: create returns `plan`, local `plans:created` event inserts immediately, delete is optimistic with rollback and per-item pending lock.
- [Encoding] Fixed broken UTF-8 strings in `SectionBackgroundSettings` and preserved the new `chat` section option.
- [Infra] Added repository-level encoding safeguards: `.editorconfig` (UTF-8/LF defaults) and `scripts/encoding_gate.py`, integrated into `qa_gate.ps1`.
- [Infra] Removed UTF-8 BOM from critical UI files (`/gallery`, `/game/quiz`, `/login`, `BackButton`, `ThemeProvider`) to prevent future mojibake regressions.

## 0.1.14 - 2026-02-26
- [Chat UX] Image sending now uses preview-before-send flow with optional caption text; image is sent only after explicit confirmation.
- [Chat UX] Chat images now open in dedicated full-screen route `/chat/media/[id]` (messenger-like viewer with back navigation).
- [Chat UI] Composer controls updated to messenger-style interactions: paperclip attachment button plus hold-to-record voice/video-note buttons.
- [Chat] Added reply flow (`reply_to_id`) with reply preview in bubbles and composer.
- [Chat] Added message edit and soft-delete for sender messages; deleted messages render as “Сообщение удалено”.
- [DB] Added migration `20260226150000_chat_message_actions.sql` for reply/edit/delete columns, RLS update policies, and trigger rules for safe update semantics.

## 0.1.15 - 2026-02-26
- [Chat UI] Replaced inline message links with a Telegram-like contextual popup menu for `Ответить / Изменить / Удалить`.
- [Chat UI] Added close-on-outside-click and `Esc` behavior for the contextual menu.
- [Chat UI] Added mobile long-press on message bubbles (with movement threshold + light haptic feedback) to open the action menu.
- [Chat UI] Desktop interaction: the message action menu now opens via right-click (ПКМ) on message bubbles.
- [Chat UI] Fixed desktop right-click handling using capture-phase context menu interception to suppress native browser menu on chat bubbles.
- [Chat UI] Improved reliability of menu invocation on mobile (less strict long-press movement tolerance) and refreshed menu styling to a cleaner Telegram-like dark popup.

## 0.1.16 - 2026-02-26
- [Infra] Added `SHARED_UPLOADS_DIR` env override for shared media storage path (Linux/Ubuntu-friendly; fallback remains Windows UNC path).
- [Wishlist] Switched wishlist photo upload path resolution to shared storage helper so Linux mount paths and chat media use a unified directory source.
- [Docs] Added README section with Ubuntu example (`/mnt/Y`) for shared uploads configuration.

## 0.1.17 - 2026-03-02
- [PWA] Replaced Home Screen icon assets with production PNGs derived from `public/icons/content.png`: `public/icons/icon-192.png`, `public/icons/icon-512.png`, and `public/icons/apple-touch-icon.png`.
- [PWA] Switched App Router metadata to explicit PWA/iOS icon configuration and linked manifest via `manifest: "/manifest.json"` in `src/app/layout.tsx`.
- [PWA] Added static `public/manifest.json` with updated app identity/colors/icons and removed `src/app/manifest.ts` to avoid conflicting manifest routes.
- [Docs] Added checklist items for manifest/icon verification and iOS Home Screen icon cache refresh steps.

## 0.1.18 - 2026-03-02
- [PWA] Re-generated app icons from the updated `public/icons/content.png` using transparent-boundary crop + centered composition on opaque background to remove dark outer halo/background artifacts on Home Screen.

## 0.1.19 - 2026-03-02
- [PWA] Re-enabled Service Worker registration on production `*.trycloudflare.com` hosts in `PwaDevCleanup` so Home Screen launch opens in standalone app mode instead of regular browser tab.

## 0.1.20 - 2026-03-02
- [PWA] Fixed auth proxy matcher to bypass `/manifest.json` (in addition to `manifest.webmanifest`), preventing login redirects on manifest fetch and restoring proper Home Screen web-app installation behavior.

## 0.1.21 - 2026-03-02
- [Dev UX] Disabled Next.js dev indicator (`N` badge) via `devIndicators: false` in `next.config.ts`.
- [Backgrounds] Added a safe fallback section background preset for `home`, `chat`, and `settings` when no per-section config is present, avoiding plain "vanilla" background after storage resets/tunnel domain changes.
- [Perf] Reduced route transition delay by removing template-level framer-motion enter animation and prefetching swipe routes in `SwipeableLayout`.

## 0.1.22 - 2026-03-02
- [Backgrounds] Removed automatic fallback section backgrounds and restored previous behavior: in-app GUI background changes only when the user explicitly configures section backgrounds in Settings.

## 0.1.23 - 2026-03-02
- [GUI] Disabled global section background rendering layer in `layout.tsx` to fully restore the previous in-app visual baseline; PWA app icon/manifest behavior remains unchanged and affects only install/Home Screen icon.
