## Troubleshooting (Dev Tunnel + PWA)

If you see `bad-precaching-response` or many `404` errors for `/_next/static/*` in DevTools:

1. Make sure the app runs on port `3001` (`npm run dev` / `npm run start`).
2. Hard refresh after unregistering old service workers:
   - DevTools -> Application -> Service Workers -> `Unregister`
3. Clear stale caches:
   - DevTools -> Application -> Storage -> `Clear site data`

In this project, Service Worker is disabled outside production to avoid stale precache manifests during tunnel/dev sessions.
