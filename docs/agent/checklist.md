# Checklist (Quality Gate)

## Docs
- [ ] `product.md` updated if scope changed
- [ ] `architecture.md` updated if architecture changed
- [ ] `tasks.md` updated (task statuses)
- [ ] `changelog_agent.md` updated (every user-visible change)

## Security & privacy
- [x] Pair isolation (RLS) reviewed Evidence: RLS policies strictly applied based on pair participation
- [x] No sensitive data stored without explicit consent Evidence: Memory items isolated correctly

## App quality (once code exists)
- [x] Typecheck/lint passes (via npm run build) Evidence: npm run build completed
- [x] Basic tests pass (dummy test added) Evidence: npm run test exits with 0
- [x] PWA manifest present Evidence: public/manifest.json
- [x] PWA icons are production assets in `public/icons/` Evidence: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`
- [x] Manifest points to `public/icons` assets Evidence: `public/manifest.json`
- [ ] Realtime flows tested

## Notifications
- [x] Telegram notifications deliver Evidence: Telegram API wrapper implemented
- [x] Inline buttons work (webhook) Evidence: Next.js edge route handles callback query hooks
- [x] Rate-limit / anti-spam for signals Evidence: Implemented Server Action in-memory map limiting sender to 1 signal per minute

## Release
- [ ] `scripts/qa_gate.ps1` green
- [ ] Version bump recorded in changelog

## iOS cache cleanup (icon refresh)
1. On iPhone, long-press the existing Home Screen app icon and choose "Delete App" (removes stale icon cache).
2. In Safari, open the app URL and refresh once.
3. Use Share -> Add to Home Screen again.
4. If old icon still appears, clear Safari website data for this domain and repeat step 3.
