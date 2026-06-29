#!/usr/bin/env python3
"""Render remade course decks in md_slides/ to PPTX.

Usage:
    uv run python tools/render_output_slides.py
    uv run python tools/render_output_slides.py --course giao_duc_chinh_tri
    uv run python tools/render_output_slides.py --only bai_03 bai_06
    uv run python tools/render_output_slides.py --deck-dir courses/giao_duc_chinh_tri/md_slides
    uv run python tools/render_output_slides.py --dry-run

This script:
1. Finds `.mdx` / `.md` decks in `courses/<course>/md_slides/`
2. Renders MDX to `.marp-cache/.../*.md`
3. Exports each rendered deck to `.pptx` with the local Marp CLI
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_COURSE = "giao_duc_chinh_tri"
DEFAULT_DEST_SUBDIR = "output/rendered-slides"
DEFAULT_THEME = ROOT / "template" / "theme.css"
DEFAULT_ENGINE = ROOT / "engine.js"
DEFAULT_MARP = ROOT / "node_modules" / ".bin" / "marp"
RENDER_MDX_SCRIPT = ROOT / "tools" / "render_mdx.mjs"
DEFAULT_NODE = shutil.which("node") or "node"


def deck_name_of(path: Path) -> str:
    return path.stem


def find_decks(deck_dir: Path, only: list[str] | None) -> list[Path]:
    decks = sorted(
        path
        for path in deck_dir.iterdir()
        if path.is_file() and path.suffix in {".mdx", ".md"}
    )
    if only:
        wanted = {name.removesuffix(".mdx").removesuffix(".md") for name in only}
        decks = [deck for deck in decks if deck.stem in wanted]
    return decks


def render_mdx(course: str, deck: str, dry_run: bool) -> None:
    cmd = [
        DEFAULT_NODE,
        str(RENDER_MDX_SCRIPT),
        "--course",
        course,
        "--deck",
        deck,
    ]
    if dry_run:
        print("    " + " ".join(cmd))
        return
    subprocess.run(cmd, cwd=ROOT, check=True)


def rendered_markdown_path(course: str, deck: str) -> Path:
    return ROOT / ".marp-cache" / course / "md_slides" / f"{deck}.md"


def export_pptx(
    rendered_md: Path,
    output_pptx: Path,
    marp_bin: Path,
    theme: Path,
    engine: Path,
    browser: str,
    browser_path: str | None,
    editable: bool,
    dry_run: bool,
) -> None:
    output_pptx.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        str(marp_bin),
        str(rendered_md),
        "--pptx",
        "--theme",
        str(theme),
        "--engine",
        str(engine),
        "--allow-local-files",
        "--html",
        "--browser",
        browser,
        "-o",
        str(output_pptx),
    ]

    if editable:
        cmd.append("--pptx-editable")
    if browser_path:
        cmd.extend(["--browser-path", browser_path])

    if dry_run:
        print("    " + " ".join(cmd))
        return
    try:
        subprocess.run(cmd, cwd=ROOT, check=True)
    except subprocess.CalledProcessError as exc:
        raise SystemExit(
            "Marp failed to export PPTX. If the error mentions no suitable browser, "
            "rerun with `--browser-path /path/to/Chrome-or-Brave` or install a "
            "supported browser and keep `--browser auto`."
        ) from exc


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Render remade decks from courses/<course>/md_slides to PPTX."
    )
    parser.add_argument(
        "--course",
        default=DEFAULT_COURSE,
        help=f"Course directory under courses/, default: {DEFAULT_COURSE}",
    )
    parser.add_argument(
        "--deck-dir",
        type=Path,
        help="Override the source deck directory. Default: courses/<course>/md_slides",
    )
    parser.add_argument(
        "--dest-dir",
        type=Path,
        help=(
            "Override the destination directory. "
            "Default: courses/<course>/output/rendered-slides"
        ),
    )
    parser.add_argument(
        "--only",
        nargs="+",
        help="Render only selected decks, e.g. --only bai_02 bai_06",
    )
    parser.add_argument(
        "--marp",
        type=Path,
        default=DEFAULT_MARP,
        help="Path to the Marp CLI binary. Default: node_modules/.bin/marp",
    )
    parser.add_argument(
        "--theme",
        type=Path,
        default=DEFAULT_THEME,
        help="Theme CSS path passed to Marp. Default: template/theme.css",
    )
    parser.add_argument(
        "--engine",
        type=Path,
        default=DEFAULT_ENGINE,
        help="Marp engine path. Default: engine.js",
    )
    parser.add_argument(
        "--browser",
        default="auto",
        choices=["auto", "chrome", "edge", "firefox"],
        help="Browser backend for Marp PPTX export. Default: auto",
    )
    parser.add_argument(
        "--browser-path",
        help="Optional explicit browser executable path for Marp.",
    )
    parser.add_argument(
        "--editable",
        action="store_true",
        help="Use Marp's experimental --pptx-editable mode.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print commands without running them.",
    )
    args = parser.parse_args()

    course_root = ROOT / "courses" / args.course
    deck_dir = (args.deck_dir or (course_root / "md_slides")).resolve()
    dest_dir = (args.dest_dir or (course_root / DEFAULT_DEST_SUBDIR)).resolve()

    if not deck_dir.exists():
        print(f"Missing deck directory: {deck_dir}", file=sys.stderr)
        return 1
    if not args.marp.exists():
        print(f"Missing Marp CLI: {args.marp}", file=sys.stderr)
        return 1
    if not args.theme.exists():
        print(f"Missing theme file: {args.theme}", file=sys.stderr)
        return 1
    if not args.engine.exists():
        print(f"Missing engine file: {args.engine}", file=sys.stderr)
        return 1

    decks = find_decks(deck_dir, args.only)
    if not decks:
        print("No decks found to render.", file=sys.stderr)
        return 1

    print(f"Found {len(decks)} deck(s) in {deck_dir.relative_to(ROOT)}")
    print(f"Destination: {dest_dir.relative_to(ROOT)}")

    for deck_path in decks:
        deck = deck_name_of(deck_path)
        rendered_md = rendered_markdown_path(args.course, deck)
        output_pptx = dest_dir / f"{deck}.pptx"

        print(f"\n==> {deck}")
        print(f"    Source: {deck_path.relative_to(ROOT)}")
        print(f"    Cache:  {rendered_md.relative_to(ROOT)}")
        print(f"    PPTX:   {output_pptx.relative_to(ROOT)}")

        render_mdx(args.course, deck, args.dry_run)
        export_pptx(
            rendered_md=rendered_md,
            output_pptx=output_pptx,
            marp_bin=args.marp.resolve(),
            theme=args.theme.resolve(),
            engine=args.engine.resolve(),
            browser=args.browser,
            browser_path=args.browser_path,
            editable=args.editable,
            dry_run=args.dry_run,
        )

    print("\nDone.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
