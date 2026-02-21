#!/usr/bin/env python3
"""task_gate.py

Ensures tasks.md follows a simple format and supports a strict release gate.

Format expected:
- [TODO] T0123 Description

In RELEASE_GATE=1:
- No tasks may remain TODO/DOING/BLOCKED.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
TASKS_PATH = REPO_ROOT / "docs" / "agent" / "tasks.md"

ALLOWED_STATUS = {"TODO", "DOING", "DONE", "BLOCKED"}
TASK_RE = re.compile(r"^- \[(?P<status>[A-Z]+)\] (?P<id>T\d{4}) (?P<desc>.+)$")


def fail(msg: str) -> None:
    print(f"GATE FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    if not TASKS_PATH.exists():
        fail("tasks.md not found")

    lines = TASKS_PATH.read_text(encoding="utf-8").splitlines()
    tasks = []
    bad = []

    for i, line in enumerate(lines, start=1):
        if not line.startswith("- ["):
            continue
        m = TASK_RE.match(line)
        if not m:
            bad.append((i, line))
            continue
        status = m.group("status")
        if status not in ALLOWED_STATUS:
            bad.append((i, line))
            continue
        tasks.append((status, m.group("id"), m.group("desc")))

    if bad:
        preview = "\n".join([f"L{ln}: {txt}" for ln, txt in bad[:30]])
        fail("Invalid task lines in tasks.md:\n" + preview)

    if not tasks:
        fail("No tasks found in tasks.md (expected at least one)")

    if os.getenv("RELEASE_GATE") == "1":
        remaining = [t for t in tasks if t[0] != "DONE"]
        if remaining:
            preview = "\n".join([f"[{s}] {tid} {d}" for s, tid, d in remaining[:50]])
            fail("RELEASE_GATE=1 requires all tasks DONE. Remaining:\n" + preview)

    print("task_gate: OK")


if __name__ == "__main__":
    main()
