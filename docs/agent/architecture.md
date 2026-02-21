# Architecture — «Наш домик»

## Overview
We build a **PWA** (Next.js) backed by **Supabase**. Realtime updates use Supabase Realtime channels and Postgres row-level security.

A Notification Router sends events to:
- Telegram Bot (primary)
- Web Push (optional)

AI Helper is an internal service interface. It consumes approved Memory Vault items and can propose new “insights” that must be confirmed.

## Components
### 1) PWA Frontend (Next.js)
- Pages/areas: Home, Support, Moments, Questions, Wishlist, Plans, Memory, Settings
- Auth: invite-only “pair code” flow
- Realtime subscriptions:
  - new moments
  - new signals
  - signal acknowledgements

### 2) Supabase
- Postgres: authoritative data store
- Storage: photos (moments/signal attachments)
- Realtime: broadcast changes
- Auth: email magic link or passcode-based (choose later)
- RLS: strict two-user pair isolation

### 3) Notification Router (Server)
Triggered when:
- a signal is created
- a moment is posted (optional)

Routes to configured channels per user.

Telegram:
- Send message with inline buttons (modes: мило/спокойно/позвонить/план)
- Button press calls webhook endpoint → returns message text suggestion + deep link to app

Web Push (optional):
- For modern iOS/desktop
- Stores push subscriptions per user

### 4) AI Helper
A simple interface:
- `suggest_reply(signal, memory)`
- `suggest_date(mood, constraints, memory)`
- `suggest_questions(topic, memory)`
- `propose_insight_from_text(text)` (requires confirmation)

Implementation plan:
- Phase 1: rule-based + templates + small randomization
- Phase 2: LLM provider (OpenAI-compatible)
- Phase 3: swap to your trained agent

## Key flows
### Signal flow
1) User A taps a signal (optionally adds photo+text)
2) Create `signals` row; upload photo if present
3) Supabase realtime notifies both clients
4) Notification Router sends Telegram message to User B
5) User B taps inline action:
   - fetch AI suggestion or template
   - optionally mark acknowledged

### Moments flow
1) User posts photo+caption
2) Upload photo → create `moments` row
3) Realtime updates both clients

## Security & privacy
- Pair isolation via RLS policies
- Minimize data retained from chat imports
- AI “insights” must be explicit and editable

## Deployment
- Frontend: Vercel or Cloudflare Pages
- Supabase: hosted
- Telegram webhook: server route / edge function

## Future
- iOS 16.4+ web push for installed PWA
- Voice notes (storage + playback)
- Export/backup
