#!/usr/bin/env python3
"""checklist_gate.py

Minimal quality gate for Marathon Mode.
- Ensures required docs exist
- Ensures docs are non-empty
- In RELEASE_GATE=1 mode, ensures checklist items are all checked.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    REPO_ROOT / "Agents.md",
    REPO_ROOT / "docs" / "agent" / "product.md",
    REPO_ROOT / "docs" / "agent" / "architecture.md",
    REPO_ROOT / "docs" / "agent" / "tasks.md",
    REPO_ROOT / "docs" / "agent" / "checklist.md",
    REPO_ROOT / "docs" / "agent" / "changelog_agent.md",
    REPO_ROOT / "docs" / "agent" / "sources.md",
    REPO_ROOT / "scripts" / "qa_gate.ps1",
    REPO_ROOT / "scripts" / "checklist_gate.py",
    REPO_ROOT / "scripts" / "task_gate.py",
]

PLACEHOLDER_PATTERNS = [
    re.compile(r"\bTBD\b", re.IGNORECASE),
    re.compile(r"\bTODO: FILL\b", re.IGNORECASE),
]


def fail(msg: str) -> None:
    print(f"GATE FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    # Existence + non-empty
    missing = [p for p in REQUIRED_FILES if not p.exists()]
    if missing:
        fail("Missing required files:\n" + "\n".join(str(p.relative_to(REPO_ROOT)) for p in missing))

    too_small = [p for p in REQUIRED_FILES if p.stat().st_size < 40]
    if too_small:
        fail("Some required files look empty/suspiciously small:\n" + "\n".join(str(p.relative_to(REPO_ROOT)) for p in too_small))

    # Placeholder scan (only for key docs)
    for p in [REPO_ROOT / "docs" / "agent" / "product.md", REPO_ROOT / "docs" / "agent" / "architecture.md"]:
        txt = p.read_text(encoding="utf-8", errors="strict")
        for pat in PLACEHOLDER_PATTERNS:
            if pat.search(txt):
                fail(f"Placeholder '{pat.pattern}' found in {p.relative_to(REPO_ROOT)}")

    # RELEASE mode: checklist must be fully checked
    if os.getenv("RELEASE_GATE") == "1":
        checklist = (REPO_ROOT / "docs" / "agent" / "checklist.md").read_text(encoding="utf-8")
        unchecked = re.findall(r"^- \[ \] .+", checklist, flags=re.MULTILINE)
        if unchecked:
            fail("RELEASE_GATE=1 requires all checklist items checked. Unchecked:\n" + "\n".join(unchecked[:50]))

    print("checklist_gate: OK")


if __name__ == "__main__":
    main()
