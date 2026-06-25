#!/usr/bin/env python3
"""Render Marp markdown decks from course output folders to PPTX files.

By default this writes PPTX files under:

    courses/<course>/output/rendered-slides/<deck-name>.pptx

The defaults match this project's local setup: a globally installed `marp`
binary and Brave used as the Chrome browser for Marp rendering.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_COURSE = "giao_duc_phap_luat"
DEFAULT_COURSE_ROOT = ROOT / "courses" / DEFAULT_COURSE
DEFAULT_OUTPUT_DIR = DEFAULT_COURSE_ROOT / "output"
DEFAULT_DEST_DIR = DEFAULT_OUTPUT_DIR / "rendered-slides"
DEFAULT_BROWSER_PATH = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"


def find_decks(output_dir: Path, only: list[str] | None) -> list[Path]:
    decks = sorted(output_dir.glob("*.md"))
    if only:
        wanted = {name.removesuffix(".md") for name in only}
        decks = [deck for deck in decks if deck.stem in wanted]
    return decks


def render_deck(
    deck: Path,
    dest_root: Path,
    marp_bin: str,
    browser_path: str,
    clean: bool,
    dry_run: bool,
    html: bool,
) -> None:
    deck_dest = dest_root
    deck_dest.mkdir(parents=True, exist_ok=True)

    output_pattern = deck_dest / f"{deck.stem}.pptx"
    cmd = [
        marp_bin,
        str(deck),
        "--pptx",
        *(["--html"] if html else []),
        # "--images",
        # "png",
        "-o",
        str(output_pattern),
        "--allow-local-files",
        "--browser",
        "chrome",
        "--browser-path",
        browser_path,
    ]

    print(f"\n==> Rendering {deck.relative_to(ROOT)}")
    print(f"    Output: {deck_dest.relative_to(ROOT)}")
    if dry_run:
        print("    " + " ".join(cmd))
        return

    subprocess.run(cmd, cwd=ROOT, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Render Marp markdown decks from a course output folder into PPTX files."
    )
    parser.add_argument(
        "--course",
        default=DEFAULT_COURSE,
        help=f"Course directory under courses/, default: {DEFAULT_COURSE}",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Directory containing .md decks. Default: courses/<course>/output",
    )
    parser.add_argument(
        "--dest-dir",
        type=Path,
        default=None,
        help="Destination root. Default: courses/<course>/output/rendered-slides",
    )
    parser.add_argument(
        "--marp",
        default="marp",
        help="Marp executable, default: marp",
    )
    parser.add_argument(
        "--browser-path",
        default=DEFAULT_BROWSER_PATH,
        help="Chrome/Brave executable path for Marp",
    )
    parser.add_argument(
        "--only",
        nargs="+",
        help="Render only selected deck names, e.g. --only bai_04 bai_06",
    )
    parser.add_argument(
        "--no-clean",
        action="store_true",
        help="Do not delete an existing per-deck output folder before rendering",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print commands without running Marp",
    )
    parser.add_argument(
        "--no-html",
        action="store_true",
        help=(
            "Disable Marp HTML rendering. By default HTML is enabled because "
            "the decks rely on inline styles and raw HTML layout."
        ),
    )
    args = parser.parse_args()

    course_root = ROOT / "courses" / args.course
    output_dir = (args.output_dir or course_root / "output").resolve()
    dest_dir = (args.dest_dir or output_dir / "rendered-slides").resolve()

    if not output_dir.exists():
        print(f"Missing output directory: {output_dir}", file=sys.stderr)
        return 1

    decks = find_decks(output_dir, args.only)
    if not decks:
        print("No markdown decks found to render.", file=sys.stderr)
        return 1

    print(f"Found {len(decks)} deck(s).")
    print(f"Destination root: {dest_dir}")

    for deck in decks:
        render_deck(
            deck=deck,
            dest_root=dest_dir,
            marp_bin=args.marp,
            browser_path=args.browser_path,
            clean=not args.no_clean,
            dry_run=args.dry_run,
            html=not args.no_html,
        )

    print("\nDone.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
