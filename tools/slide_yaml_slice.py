#!/usr/bin/env python3
"""Print selected slide blocks from an extracted PPTX YAML file.

This keeps AI review focused on a small slide range instead of loading the
entire analysis file.

Usage:
    uv run python tools/slide_yaml_slice.py courses/giao_duc_chinh_tri/pptx-analysis/bai_02/bai_02.yaml --slides 1,4,7-9
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path


SLIDE_RE = re.compile(r"^  - number:\s+(\d+)\s*$")
SLIDE_COUNT_RE = re.compile(r"^slide_count:\s+(\d+)\s*$")
SCREENSHOT_RE = re.compile(r'^\s+screenshot:\s+"?([^"]+)"?\s*$')
IMAGE_FILE_RE = re.compile(r'^\s+file:\s+"?([^"]+)"?\s*$')


def parse_slide_selection(value: str) -> set[int]:
    selected: set[int] = set()
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_text, end_text = part.split("-", 1)
            start = int(start_text)
            end = int(end_text)
            if end < start:
                raise ValueError(f"Invalid slide range: {part}")
            selected.update(range(start, end + 1))
        else:
            selected.add(int(part))
    if not selected:
        raise ValueError("No slides selected")
    return selected


def slide_blocks(lines: list[str]) -> dict[int, list[str]]:
    starts: list[tuple[int, int]] = []
    for index, line in enumerate(lines):
        match = SLIDE_RE.match(line)
        if match:
            starts.append((int(match.group(1)), index))

    blocks: dict[int, list[str]] = {}
    for position, (number, start) in enumerate(starts):
        end = starts[position + 1][1] if position + 1 < len(starts) else len(lines)
        blocks[number] = lines[start:end]
    return blocks


def slide_count(lines: list[str]) -> int | None:
    for line in lines[:20]:
        match = SLIDE_COUNT_RE.match(line)
        if match:
            return int(match.group(1))
    return None


def resolve_paths(base_dir: Path, block: list[str]) -> tuple[str | None, list[str]]:
    screenshot: str | None = None
    images: list[str] = []
    for line in block:
        screenshot_match = SCREENSHOT_RE.match(line)
        if screenshot_match:
            screenshot = str((base_dir / screenshot_match.group(1)).resolve())
            continue

        image_match = IMAGE_FILE_RE.match(line)
        if image_match:
            images.append(str((base_dir / image_match.group(1)).resolve()))
    return screenshot, images


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("yaml", type=Path, help="Path to extracted PPTX YAML")
    parser.add_argument(
        "--slides",
        required=True,
        help="Slide numbers or ranges, for example: 1,4,7-9",
    )
    parser.add_argument(
        "--paths",
        action="store_true",
        help="Also print absolute screenshot/image paths for quick visual review",
    )
    args = parser.parse_args()

    yaml_path = args.yaml.resolve()
    lines = yaml_path.read_text(encoding="utf-8").splitlines()
    selected = parse_slide_selection(args.slides)
    blocks = slide_blocks(lines)

    print(f"yaml: \"{yaml_path}\"")
    print(f"base_dir: \"{yaml_path.parent}\"")
    count = slide_count(lines)
    if count is not None:
        print(f"slide_count: {count}")
    print("slides:")

    missing: list[int] = []
    for number in sorted(selected):
        block = blocks.get(number)
        if block is None:
            missing.append(number)
            continue
        for line in block:
            print(line)
        if args.paths:
            screenshot, images = resolve_paths(yaml_path.parent, block)
            print("    resolved_paths:")
            if screenshot:
                print(f"      screenshot: \"{screenshot}\"")
            if images:
                print("      images:")
                for image in images:
                    print(f"        - \"{image}\"")

    if missing:
        print(f"missing_slides: {missing}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
