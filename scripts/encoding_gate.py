#!/usr/bin/env python3
"""Encoding quality gate: UTF-8 (no BOM) + basic mojibake detection."""

from __future__ import annotations

from pathlib import Path
import re
import sys


TEXT_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".css",
    ".md",
    ".yml",
    ".yaml",
    ".sql",
    ".ps1",
    ".txt",
    ".html",
}

SCAN_ROOTS = ("src", "supabase", "scripts")

IGNORE_DIRS = {
    ".git",
    ".next",
    "node_modules",
    "dist",
    "coverage",
    ".serena",
}

# Common mojibake fragments seen when UTF-8 text is decoded as cp1251/cp1252.
MOJIBAKE_PATTERN = re.compile(
    r"[РС][ЃЌЋЏђѓєѕіїјљњћќўџ]|вЂ|рџ|â€™|â€œ|â€"
)


def should_skip(path: Path) -> bool:
    return any(part in IGNORE_DIRS for part in path.parts)


def collect_files(root: Path) -> list[Path]:
    files: list[Path] = []
    if not root.exists():
        return files
    for path in root.rglob("*"):
        if path.is_file() and not should_skip(path) and path.suffix.lower() in TEXT_EXTENSIONS:
            files.append(path)
    return files


def main() -> int:
    repo_root = Path.cwd()
    targets: list[Path] = []
    for root_name in SCAN_ROOTS:
        targets.extend(collect_files(repo_root / root_name))

    bom_errors: list[str] = []
    decode_errors: list[str] = []
    mojibake_errors: list[str] = []

    for file_path in sorted(targets):
        data = file_path.read_bytes()

        if data.startswith(b"\xef\xbb\xbf"):
            bom_errors.append(str(file_path))

        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            decode_errors.append(str(file_path))
            continue

        if MOJIBAKE_PATTERN.search(text):
            mojibake_errors.append(str(file_path))

    failed = False

    if bom_errors:
        failed = True
        print("encoding_gate: FAIL (UTF-8 BOM found)")
        for p in bom_errors:
            print(f"  - {p}")

    if decode_errors:
        failed = True
        print("encoding_gate: FAIL (non UTF-8 file)")
        for p in decode_errors:
            print(f"  - {p}")

    if mojibake_errors:
        failed = True
        print("encoding_gate: FAIL (suspicious mojibake fragments)")
        for p in mojibake_errors:
            print(f"  - {p}")

    if failed:
        return 1

    print("encoding_gate: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
