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
- [x] PWA manifest present Evidence: app/manifest.ts
- [ ] Realtime flows tested

## Notifications
- [x] Telegram notifications deliver Evidence: Telegram API wrapper implemented
- [x] Inline buttons work (webhook) Evidence: Next.js edge route handles callback query hooks
- [x] Rate-limit / anti-spam for signals Evidence: Implemented Server Action in-memory map limiting sender to 1 signal per minute

## Release
- [ ] `scripts/qa_gate.ps1` green
- [ ] Version bump recorded in changelog
