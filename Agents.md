# AGENTS.md — Nash Domik (PWA for Two)

This repository is designed to be executed in **Marathon Mode**: work iteratively until the backlog is closed and the quality gate is green.

## Product at a glance
A private PWA for two people (“Наша пара”), focused on **милота + близость (70/30)**:
- 1‑tap signals: *Скучаю / Поговорить / Обнимашки / Мне тяжело*
- Realtime moments: add **photo + text** (and optionally audio later)
- Packs of warm questions (no competition)
- Wishlist + links
- Plans/date ideas
- AI helper (ideas + context), with explicit user approval for saving “insights”

Detailed spec: `docs/agent/product.md`

## Repo rules (hard)
1. No invented APIs. Verify library behavior against official docs.
2. UTF‑8 (no BOM). Keep filenames case-sensitive as stored.
3. Every user-visible change must update `docs/agent/changelog_agent.md`.
4. Before “done”: run gates in `scripts/qa_gate.ps1`.

## Gates
Run (Windows PowerShell):
```powershell
./scripts/qa_gate.ps1
```

Gates include:
- Docs presence + basic consistency (`checklist_gate.py`, `task_gate.py`)
- (Later) lint/tests/build once app code exists

## Marathon workflow
1) Read all docs in `docs/agent/`.
2) Pick the top task in `docs/agent/tasks.md`.
3) Implement, add tests (when applicable), update docs + changelog.
4) Run `./scripts/qa_gate.ps1` until green.

## Design direction
Chosen UI style: **cozy cartoon** (see reference image provided in chat). The PWA should still follow accessibility basics: readable fonts, large touch targets, clear contrast.
