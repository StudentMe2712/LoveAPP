# Tasks Backlog

Legend: `TODO | DOING | DONE | BLOCKED`

## Phase 0 — Repo & Gates
- [DONE] T0001 Create project skeleton (Next.js + TS + Tailwind) and PWA setup
  - [x] Acceptance: Next.js + TS + Tailwind initialized in repo root
  - [x] Acceptance: PWA manifest.json and service worker generated
  - [x] Acceptance: 'npm run build' succeeds
- [DONE] T0002 Supabase project setup (schema + RLS) for pair isolation
  - [x] Acceptance: Supabase initialized locally (supabase init)
  - [x] Acceptance: Initial SQL migration created with RLS for pair isolation
  - [x] Acceptance: Schema includes basic tables (pair, signals, moments, memory_items, etc.)
- [DONE] T0003 Telegram bot + webhook endpoint + Notification Router
  - [x] Acceptance: Notification Router implemented to route signals
  - [x] Acceptance: Telegram bot API integration for sendMessage implemented
  - [x] Acceptance: Webhook endpoint for Telegram callback queries created
- [DONE] T0004 Basic QA gates: docs checks + task checks + (later) lint/test/build

## Phase 1 — Core UX
- [DONE] T0101 Home screen (chosen cozy UI) + Light/Dark themes
  - [x] Acceptance: Cozy UI styles applied (warm wood colors, soft edges)
  - [x] Acceptance: Light and Dark mode supported
  - [x] Acceptance: Home screen displays the 4 signal buttons
- [DONE] T0102 Signals: create + acknowledge + anti-spam
  - [x] Acceptance: Server action created to insert signal into Supabase and call Notification Router
  - [x] Acceptance: Anti-spam rate limiting implemented (e.g. 1 per minute)
  - [x] Acceptance: UI shows loading state and success/error toast
- [DONE] T0103 Moments: photo upload + caption + realtime feed
  - [x] Acceptance: UI to upload a photo and add a caption
  - [x] Acceptance: Moments are saved to Supabase (storage + DB)
  - [x] Acceptance: Realtime subscription displays new moments instantly
- [DONE] T0104 Reply templates library + randomization
  - [x] Acceptance: Pre-defined reply templates exist in the DB or code
  - [x] Acceptance: UI allows selecting or randomizing a template when replying to a signal

## Phase 2 — Warm Content
- [DONE] T0201 Question packs + answers + save to Memory
  - [x] Acceptance: UI to browse question topics and see current question
  - [x] Acceptance: Answer can be submitted and saved to DB
  - [x] Acceptance: Good answers can be optionally added to the Memory Vault
- [DONE] T0202 Wishlist: add link + tags + hint mode
  - [x] Acceptance: UI to add a link with a short description and tags
  - [x] Acceptance: Items save to DB and sync in realtime
  - [x] Acceptance: Status toggles (e.g. 'хочу' vs 'подарено')
- [DONE] T0203 Plans: suggest slots + pick + reminders
  - [x] Acceptance: UI to suggest dates, times, and activities
  - [x] Acceptance: Partner can review suggestions and pick an option
  - [x] Acceptance: "Plan finalized" state with option to trigger Telegram reminder

## Phase 3 — AI Helper
- [DONE] T0301 AI interface + stub rules
- [DONE] T0302 AI: suggest reply/date/questions using Memory
- [DONE] T0303 “Insight proposals” with user confirmation

## Phase 4 — Polishing
- [DONE] T0401 Accessibility + performance pass
- [DONE] T0402 Export/delete data
- [DONE] T0403 Documentation & demo script

## Phase 5 — GUI & UX Improvements
- [DONE] T0501 Page transition animations (framer-motion)
- [DONE] T0502 Authentication & Pair Management (Magic Link)
- [DONE] T0503 Profile Customization (Avatar & Name)
- [DONE] T0504 Empty States Illustrations (Cute vectors)
- [DONE] T0505 Mini-games "Поиграем?" (Tic-Tac-Toe & Drawing Board via Realtime)

## Phase 6 — UX Polish & Notifications
- [ ] T0601 Fix "Today's moment" button text to show "Загрузить" instead of "Послушать это"
- [ ] T0602 Add full-screen image view modal in the Gallery
- [ ] T0603 Wishlist: show full details of items on click (expand/modal)
- [ ] T0604 Rename "Память" tab to "Вишлист" in BottomNav
- [ ] T0605 Deletion feature: Add UI to delete moments, wishlist items, and plans
- [ ] T0606 Plans UX: Improve slot selection design to make it intuitive
- [ ] T0607 Notifications Bell: Add a dropdown/modal to show recent signals/notifications
- [ ] T0608 Notification CRON: Implement periodic Telegram reminders for upcoming plans (24h, 12h, 6h, 3h, 1h, 30m) and inactivity reminders (1h+)
