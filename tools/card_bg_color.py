#!/usr/bin/env python3
"""Suggest a card background color from an image.

The script samples mostly from the outer border of the image because card
backgrounds should usually match the image canvas/background, not the subject.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from PIL import Image


def srgb_to_linear(value: int) -> float:
    x = value / 255
    return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4


def relative_luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = (srgb_to_linear(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def edge_crop_box(width: int, height: int, edge_percent: float) -> list[tuple[int, int, int, int]]:
    edge_x = max(1, int(width * edge_percent))
    edge_y = max(1, int(height * edge_percent))
    return [
        (0, 0, width, edge_y),
        (0, height - edge_y, width, height),
        (0, 0, edge_x, height),
        (width - edge_x, 0, width, height),
    ]


def iter_edge_pixels(
    image: Image.Image, edge_percent: float, ignore_white: int | None
) -> Iterable[tuple[int, int, int]]:
    rgba = image.convert("RGBA")
    for box in edge_crop_box(rgba.width, rgba.height, edge_percent):
        for r, g, b, a in rgba.crop(box).getdata():
            if a >= 16:
                if ignore_white is not None and min(r, g, b) >= ignore_white:
                    continue
                yield (r, g, b)


def dominant_edge_color(
    path: Path, edge_percent: float, colors: int, ignore_white: int | None
) -> tuple[int, int, int]:
    image = Image.open(path)
    image.thumbnail((900, 900))

    pixels = list(iter_edge_pixels(image, edge_percent, ignore_white))
    if not pixels and ignore_white is not None:
        pixels = list(iter_edge_pixels(image, edge_percent, None))
    if not pixels:
        raise ValueError(f"No visible pixels found in {path}")

    sample = Image.new("RGB", (len(pixels), 1))
    sample.putdata(pixels)
    quantized = sample.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    palette = quantized.getpalette() or []
    counts = quantized.getcolors(maxcolors=colors) or []

    candidates: list[tuple[float, int, tuple[int, int, int]]] = []
    for count, index in counts:
        offset = index * 3
        rgb = tuple(palette[offset : offset + 3])
        if len(rgb) != 3:
            continue
        rgb3 = (int(rgb[0]), int(rgb[1]), int(rgb[2]))
        luminance = relative_luminance(rgb3)
        candidates.append((luminance, count, rgb3))

    if not candidates:
        raise ValueError(f"Could not extract a palette from {path}")

    total = sum(count for _, count, _ in candidates)
    # Background cards usually want the most common light edge color. Prefer
    # light clusters, but fall back to the dominant color for dark images.
    light_candidates = [
        (lum, count, rgb)
        for lum, count, rgb in candidates
        if lum >= 0.72 and count / total >= 0.03
    ]
    pool = light_candidates or candidates
    pool.sort(key=lambda item: (item[1], item[0]), reverse=True)
    return pool[0][2]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Return a suggested CSS background color for an image card."
    )
    parser.add_argument("image", type=Path, help="Path to the image file")
    parser.add_argument(
        "--edge-percent",
        type=float,
        default=0.12,
        help="Percentage of each image edge to sample, default: 0.12",
    )
    parser.add_argument(
        "--colors",
        type=int,
        default=12,
        help="Palette size for color clustering, default: 12",
    )
    parser.add_argument(
        "--css-var",
        default="--card-bg",
        help="CSS variable name to print, default: --card-bg",
    )
    parser.add_argument(
        "--ignore-white",
        nargs="?",
        const=253,
        type=int,
        default=None,
        metavar="THRESHOLD",
        help=(
            "Ignore pure/near-white pixels where every RGB channel is at least "
            "THRESHOLD. Use without a value for 253."
        ),
    )
    args = parser.parse_args()

    rgb = dominant_edge_color(args.image, args.edge_percent, args.colors, args.ignore_white)
    hex_color = rgb_to_hex(rgb)
    print(hex_color)
    print(f"{args.css_var}: {hex_color};")
    print(f'background: var({args.css_var}, {hex_color});')


if __name__ == "__main__":
    main()
