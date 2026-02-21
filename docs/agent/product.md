# Product Spec — «Наш домик» (PWA)

## One-liner
A private, cozy PWA for **two people** that makes it easy to signal feelings, share moments (photo+text) in realtime, and keep a gentle “relationship OS” with plans, questions, and an AI helper.

## Target users
- Exactly **2 accounts**: you + your girlfriend.
- iPhone usage (Safari + Add to Home Screen). You also want notifications on PC and/or Telegram.

## Primary goals
1) Increase touch points (write more often, with less friction)
2) Bring more romance (ideas + rituals)
3) Stop forgetting plans
4) Keep it private and non-creepy

## Core feature list (final vision)
### A. Signals (Support Button)
- 4 signals: **Скучаю / Хочу поговорить / Хочу обнимашки / Мне тяжело**
- Optional payload: **photo + caption** (realtime “moment”) and/or short note.
- Recipient experience: actionable suggestions (AI) + 1‑tap reply templates.

### B. Realtime Moments (Photo+Text)
- Quick post with **photo + caption**.
- Shows instantly for both users.
- Can be attached to a signal (e.g., “Скучаю” + selfie + “смотри, я тут”).

### C. Warm Question Packs
- Packs by theme: *про нас, хобби, фильмы/сериалы/мульты, смешное, глубокое*.
- “Warm” progress: shared completion count, saves best answers into Memory.

### D. Wishlist + Links
- Save links with title, image preview, note, tags.
- Optional “Hint mode” (show category only, hide details).

### E. Plans & Dates
- Lightweight plans list.
- “Suggest a date”: propose 2–3 slots; partner picks one.
- AI date ideas by time/budget/mood.

### F. Memory Vault
- Manually saved facts/rules: likes/dislikes, “how to support me when…”, favorites.
- Editable.

### G. AI Helper (phase 2)
- Generates: message ideas, date ideas, question packs.
- Remembers context from **Memory Vault**.
- Can propose “insights” (inferred preferences) but must ask to save.
- Optional: import chat transcripts (explicit consent from both).

## Non-goals (for now)
- Public social features
- Multi-user scaling
- Health diagnostics or therapy replacement
- Always-on surveillance/location tracking

## UX baseline (chosen style)
- Cozy cartoon theme (warm wood, soft edges) **as shown in reference**.
- Keep touch targets large and readable.
- Two themes supported in code: Light & Dark.

## Notifications strategy
Because one device is iOS 15.7.7:
- Channel 1: **Telegram bot** notifications (reliable for iPhone 15 + PC)
- Channel 2: **Web Push** for modern iOS/desktop (optional)

We will implement a **Notification Router** so we can add/disable channels per user.

## Suggested MVP scope (first shippable)
1) Invite-only 2 accounts
2) Signals + acknowledgement + reply templates
3) Realtime moments (photo+caption)
4) Question packs (basic)
5) Wishlist (basic)
6) Plans (basic)
7) Minimal admin/settings

## Tech stack (recommended)
Frontend:
- **Next.js (App Router) + TypeScript**
- Tailwind CSS (fast UI iteration)
- PWA: `manifest.json`, service worker (Workbox or next-pwa)

Backend:
- **Supabase** (Auth, Postgres, Realtime, Storage)
- Edge Functions / server routes for webhook integrations

Notifications:
- Telegram Bot API (primary)
- Web Push (later / where supported)

AI:
- Provider interface (pluggable)
- Start with stub rules or OpenAI-compatible endpoint; later swap to your trained agent.

## Data model (high level)
- users (2)
- pair
- signals
- moments (photo+caption)
- replies (templates)
- questions / packs / answers
- wishlist_items
- plans
- memory_items

## Success metrics (simple)
- 3–7 meaningful interactions per week
- At least 1 plan/date created per week
- “Feels easier to reach out” feedback
