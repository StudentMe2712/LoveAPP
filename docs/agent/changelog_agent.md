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
