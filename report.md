# GUI-First Status Report — Nash Domik

Дата среза: 2026-02-25
Целевые устройства: iPhone 7+ (iOS 15 Safari), iPhone 16 Pro Max (iOS 18 Safari)

## Что сделано (реально внедрено)

### 1) Минимальная infra-база для стабильного GUI
- `docs/agent/tasks.md`: формат задач T0601–T0608 приведен к gate-валидному (`[TODO]`).
- `scripts/qa_gate.ps1`: сделан fail-fast по exit-code для `python/npm` шагов, убран ложный pass при падениях.
- `eslint.config.mjs`: локальные helper-скрипты исключены из lint-потока (`disable.js`, `link_users.js`).
- Миграция `middleware -> proxy` завершена: используется `src/proxy.ts`, `src/middleware.ts` удален.

### 2) P0 GUI stability (runtime + lint errors)
- Закрыты блокирующие lint errors в критичных UI-модулях (`Journey`, `Memory`, `ThemeProvider`, `UserStatusWidget`, `PlansWidget`, quiz/spicy/login/push/cron/webpush и др.).
- `ThemeProvider`: убран `mounted`-антипаттерн, инициализация темы/палитры переведена на safe lazy-init.
- `UserStatusWidget`: стабилизирован клиент Supabase (`useMemo`), исправлен lifecycle загрузки статусов, аватар переведен на `next/image`.
- `MemoryPage`: исправлен старт инициализации игры (без cascade lint-ошибки), карточки с фото переведены на `next/image`.
- `JourneyPage`: убран cascade effect для auto-level; прогресс турбо перенесен в flow обновления score.
- `qa_gate`, `build` и `lint` проходят (lint без errors).

### 3) P1 GUI consistency polish
- Добавлены дизайн-токены в `globals.css`:
  - spacing `--space-1..8`
  - radii `--radius-sm/md/lg/xl`
  - shadows `--shadow-soft`, `--shadow-card`
  - text tokens `--text-title/subtitle/body/caption`
- Добавлены UI-примитивы в `src/components/ui/`:
  - `Card.tsx`
  - `Button.tsx`
  - `Field.tsx`
  - `StateBlock.tsx`
- Частичная миграция приоритетных экранов на примитивы:
  - `/journey` (fallback card)
  - `/gallery` (state blocks + card tiles)
  - `/wishlist` (button + empty state)
  - `/game/quiz` (loading state block)
  - `/settings` (theme card + image component)
- `BackButton` унифицирован по виду и touch-target (44px+), теперь единый на внутренних страницах.

### 4) Device hardening (iPhone 7+ / 16 Pro Max)
- Добавлены safe-area утилиты (`app-safe-top`, `app-safe-bottom`) и применены на целевых страницах.
- `BottomNav` учитывает `env(safe-area-inset-bottom)`.
- `SwipeableLayout` ужесточен (threshold + diagonal filter), чтобы снизить случайные свайпы.
- Для `/journey` сердце поднято и привязано через `bottom` + safe-area, чтобы не теряться на низких экранах.
- Добавлена поддержка reduced-motion (глобально + на ключевых анимациях `/journey`).

## Актуальная перепроверка
- `npm run -s lint`: 0 errors, 7 warnings.
- `npm run -s build`: PASS.
- `./scripts/qa_gate.ps1`: PASS.

## Что осталось (не блокирует релиз GUI-пакета)
- Lint warnings (7 шт.) в нецелевых/вторичных местах:
  - `src/app/actions/signals.ts`
  - `src/app/api/images/[filename]/route.ts`
  - `src/app/api/notifications/smart/route.ts`
  - `src/app/api/push/subscribe/route.ts`
  - `src/app/gallery/page.tsx` (unused `isOwner` prop в `Lightbox`)
  - `src/components/MomentUploader.tsx`
  - `src/components/MomentsFeed.tsx`

## Следующие GUI-шаги (рекомендованный порядок)
1. Добить 7 warnings до нуля.
2. Доработать миграцию на UI-примитивы (доработать `Field/Button/Card` применение на формах settings/wishlist/quiz).
3. Добавить визуальные smoke checks для iPhone 7+/16 Pro Max (ключевые маршруты: `/`, `/wishlist`, `/journey`, `/gallery`, `/game/quiz`, `/settings`).
4. Подключить `@serwist/next/typings` в `tsconfig` (чтобы убрать warning из build).

## Chat MVP (2026-02-26)
- Добавлен новый раздел `/chat` с realtime-чатом для пары: отправка/получение текста, typing-индикатор, статусы прочтения `✓/✓✓`, optimistic send.
- Добавлены server actions для чата: bootstrap + пагинация, отправка, mark-as-read, AI-совет по контексту с подстановкой имени партнёра.
- Имена/аватары берутся из `profiles` (fallback сохранён).
- В `BottomNav` добавлена вкладка `Чат`, обновлён порядок свайпов: `Дом -> Чат -> Вишлист -> Наш путь -> Вместе -> Для двоих`.
- Система фоновых тем по разделам расширена новым ключом `chat`.
