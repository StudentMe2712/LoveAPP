## Troubleshooting (Dev Tunnel + PWA)

If you see `bad-precaching-response` or many `404` errors for `/_next/static/*` in DevTools:

1. Make sure the app runs on port `3001` (`npm run dev` / `npm run start`).
2. Hard refresh after unregistering old service workers:
   - DevTools -> Application -> Service Workers -> `Unregister`
3. Clear stale caches:
   - DevTools -> Application -> Storage -> `Clear site data`

In this project, Service Worker is disabled outside production and also cleaned on `localhost`/`127.0.0.1` to avoid stale precache manifests during rebuild/start cycles.

## Redis (Upstash) - optional acceleration

This project supports optional Redis integration (Upstash REST) for:

1. Stable signal rate-limit across restarts/instances.
2. AI cache for Quiz and Spicy generation endpoints.

Required env vars:

1. `UPSTASH_REDIS_REST_URL`
2. `UPSTASH_REDIS_REST_TOKEN`
3. `REDIS_ENABLED=true`
4. `REDIS_RATE_LIMIT_SIGNALS=true`
5. `REDIS_CACHE_AI=true`

Verification:

1. Trigger signal/AI flows and inspect server logs.
2. Expected structured markers:
   - `redis=hit|miss|fallback`
   - `scope=signal_rl|quiz_ai|spicy_ai`

If Redis is unavailable, the app falls back safely:

1. Signals use in-memory anti-spam.
2. AI generation works without cache.

## Section Backgrounds (except Journey)

Background customization is now available per section and stored locally on each device.

1. Settings -> "Фоны по разделам".
2. You can pick a preset or upload your own image.
3. Upload limits:
   - input file up to `10MB`;
   - auto-compressed to WebP (max edge `1440px`);
   - final stored image up to `900KB`.
4. Storage:
   - config key in localStorage: `nd.section_backgrounds.v1`;
   - uploaded blobs in IndexedDB: `nash_domik_assets/section_backgrounds`.
5. `/journey` is intentionally excluded and keeps its fixed dedicated background.
