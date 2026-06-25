#!/usr/bin/env python3
"""Insert a non-breaking space between the last two words in HTML text nodes."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


TEXT_TAGS = ("p", "li", "h1", "h2", "h3", "h4", "span", "figcaption")
WORD_JOIN_RE = re.compile(r"(\S+)\s+(\S+)(\s*)$")


def protect_last_words(text: str) -> str:
    if "&nbsp;" in text[-32:]:
        return text
    if len(text.strip().split()) < 2:
        return text
    return WORD_JOIN_RE.sub(r"\1&nbsp;\2\3", text)


def protect_html_content(content: str) -> str:
    parts = re.split(r"(<[^>]+>)", content)
    for index in range(len(parts) - 1, -1, -1):
        part = parts[index]
        if not part or part.startswith("<"):
            continue
        updated = protect_last_words(part)
        if updated != part:
            parts[index] = updated
            break
    return "".join(parts)


def protect_tag(text: str, tag: str) -> str:
    pattern = re.compile(rf"(<{tag}\b[^>]*>)(.*?)(</{tag}>)", re.DOTALL)

    def replace(match: re.Match[str]) -> str:
        open_tag, content, close_tag = match.groups()
        return open_tag + protect_html_content(content) + close_tag

    return pattern.sub(replace, text)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Avoid orphan words by adding &nbsp; before the last word."
    )
    parser.add_argument("file", type=Path)
    args = parser.parse_args()

    text = args.file.read_text()
    before = text
    for tag in TEXT_TAGS:
        text = protect_tag(text, tag)

    args.file.write_text(text)
    print(f"updated_nbsp={text.count('&nbsp;') - before.count('&nbsp;')}")


if __name__ == "__main__":
    main()
