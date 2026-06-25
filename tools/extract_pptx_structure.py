#!/usr/bin/env python3
"""Extract PPTX slide text, embedded images, and slide screenshots to YAML.

Usage:
    tools/extract_pptx_structure.py courses/giao_duc_phap_luat/source-ppt/bai_01.pptx
    tools/extract_pptx_structure.py courses/giao_duc_phap_luat/source-ppt/bai_01.pptx --out courses/giao_duc_phap_luat/output/bai_01.yaml

The script uses only Python's standard library for PPTX parsing. Slide
screenshots are rendered with LibreOffice (`soffice`) and Poppler (`pdftoppm`),
with a LibreOffice-only fallback for environments where Poppler is broken.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_ROOT = ROOT / "pptx-analysis"

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


@dataclass(frozen=True)
class Relationship:
    rel_type: str
    target: str
    target_mode: str | None


@dataclass(frozen=True)
class SlideRef:
    rel_id: str | None
    part: str


def qn(namespace: str, tag: str) -> str:
    return f"{{{NS[namespace]}}}{tag}"


def natural_key(path: str) -> tuple[int, str]:
    match = re.search(r"slide(\d+)\.xml$", path)
    if match:
        return (int(match.group(1)), path)
    return (10**9, path)


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def read_xml(zf: zipfile.ZipFile, name: str) -> ET.Element:
    return ET.fromstring(zf.read(name))


def read_relationships(zf: zipfile.ZipFile, rels_path: str) -> dict[str, Relationship]:
    if rels_path not in zf.namelist():
        return {}
    root = read_xml(zf, rels_path)
    rels: dict[str, Relationship] = {}
    for rel in root.findall("rel:Relationship", NS):
        rel_id = rel.attrib.get("Id")
        if not rel_id:
            continue
        rels[rel_id] = Relationship(
            rel_type=rel.attrib.get("Type", ""),
            target=rel.attrib.get("Target", ""),
            target_mode=rel.attrib.get("TargetMode"),
        )
    return rels


def normalize_part_path(base_part: str, target: str) -> str:
    if target.startswith("/"):
        return target.lstrip("/")
    base_dir = Path(base_part).parent
    return os.path.normpath(str(base_dir / target)).replace("\\", "/")


def get_ordered_slide_refs(zf: zipfile.ZipFile) -> list[SlideRef]:
    names = set(zf.namelist())
    presentation_path = "ppt/presentation.xml"
    presentation_rels_path = "ppt/_rels/presentation.xml.rels"
    if presentation_path not in names or presentation_rels_path not in names:
        return [
            SlideRef(rel_id=None, part=n)
            for n in sorted(
            [n for n in names if n.startswith("ppt/slides/slide") and n.endswith(".xml")],
            key=natural_key,
            )
        ]

    presentation = read_xml(zf, presentation_path)
    rels = read_relationships(zf, presentation_rels_path)
    ordered: list[SlideRef] = []
    for slide_id in presentation.findall(".//p:sldIdLst/p:sldId", NS):
        rel_id = slide_id.attrib.get(qn("r", "id"))
        if not rel_id or rel_id not in rels:
            continue
        ordered.append(SlideRef(rel_id=rel_id, part=normalize_part_path(presentation_path, rels[rel_id].target)))
    return ordered


def get_ordered_slide_parts(zf: zipfile.ZipFile) -> list[str]:
    return [ref.part for ref in get_ordered_slide_refs(zf)]


def extract_shape_name(node: ET.Element) -> str | None:
    c_nv_pr = node.find(".//p:cNvPr", NS)
    if c_nv_pr is None:
        return None
    return c_nv_pr.attrib.get("name")


def extract_position(node: ET.Element) -> dict[str, int] | None:
    xfrm = node.find(".//a:xfrm", NS)
    if xfrm is None:
        return None
    off = xfrm.find("a:off", NS)
    ext = xfrm.find("a:ext", NS)
    data: dict[str, int] = {}
    if off is not None:
        data["x"] = int(off.attrib.get("x", "0"))
        data["y"] = int(off.attrib.get("y", "0"))
    if ext is not None:
        data["cx"] = int(ext.attrib.get("cx", "0"))
        data["cy"] = int(ext.attrib.get("cy", "0"))
    return data or None


def read_order_key(node: ET.Element) -> tuple[int, int]:
    position = extract_position(node) or {}
    return (position.get("y", 0), position.get("x", 0))


def run_font_size(run: ET.Element) -> float | None:
    r_pr = run.find("a:rPr", NS)
    if r_pr is None or "sz" not in r_pr.attrib:
        return None
    return int(r_pr.attrib["sz"]) / 100


def run_is_bold(run: ET.Element) -> bool:
    r_pr = run.find("a:rPr", NS)
    return r_pr is not None and r_pr.attrib.get("b") == "1"


def markdown_text(text: str, bold: bool) -> str:
    if not bold or not text.strip():
        return text
    leading_len = len(text) - len(text.lstrip())
    trailing_len = len(text) - len(text.rstrip())
    leading = text[:leading_len]
    trailing = text[len(text) - trailing_len :] if trailing_len else ""
    core = text[leading_len : len(text) - trailing_len if trailing_len else len(text)]
    return f"{leading}**{core}**{trailing}"


def merge_segments(segments: list[tuple[str, bool]]) -> list[tuple[str, bool]]:
    merged: list[tuple[str, bool]] = []
    for text, bold in segments:
        text = text.replace("\t", "  ")
        if not text:
            continue
        if merged and merged[-1][1] == bold:
            prev_text, prev_bold = merged[-1]
            merged[-1] = (prev_text + text, prev_bold)
        else:
            merged.append((text, bold))
    return merged


def most_common_font_size(font_sizes: list[float]) -> float | None:
    if not font_sizes:
        return None
    counts: dict[float, int] = {}
    for size in font_sizes:
        counts[size] = counts.get(size, 0) + 1
    return sorted(counts.items(), key=lambda item: (-item[1], -item[0]))[0][0]


def clean_text_block(lines: list[str]) -> str:
    cleaned = [line.strip() for line in lines]
    while cleaned and cleaned[0] == "":
        cleaned.pop(0)
    while cleaned and cleaned[-1] == "":
        cleaned.pop()
    return "\n".join(cleaned)


def extract_text_blocks(slide_root: ET.Element) -> list[dict[str, Any]]:
    raw_blocks: list[tuple[tuple[int, int], dict[str, Any]]] = []
    text_shapes = slide_root.findall(".//p:sp", NS) + slide_root.findall(".//p:graphicFrame", NS)
    for shape in text_shapes:
        lines: list[str] = []
        font_sizes: list[float] = []
        for paragraph in shape.findall(".//a:p", NS):
            segments: list[tuple[str, bool]] = []

            for child in paragraph:
                if local_name(child.tag) == "br":
                    segments.append(("\n", False))
                    continue
                if local_name(child.tag) != "r":
                    continue
                text_node = child.find("a:t", NS)
                if text_node is None:
                    continue
                text = text_node.text or ""
                font_size = run_font_size(child)
                if font_size is not None:
                    font_sizes.append(font_size)
                segments.append((text, run_is_bold(child)))

            line = "".join(markdown_text(text, bold) for text, bold in merge_segments(segments))
            if line.strip():
                lines.append(line)

        if lines:
            text = clean_text_block(lines)
            if not text:
                continue
            block: dict[str, Any] = {
                "font_size_pt": most_common_font_size(font_sizes),
                "text": text,
            }
            raw_blocks.append((read_order_key(shape), block))

    blocks = [block for _, block in sorted(raw_blocks, key=lambda item: item[0])]
    for index, block in enumerate(blocks, start=1):
        block["index"] = index
        ordered = {"index": block.pop("index")}
        if block.get("font_size_pt") is not None:
            ordered["font_size_pt"] = block["font_size_pt"]
        ordered["text"] = block["text"]
        blocks[index - 1] = ordered
    return blocks


def target_filename(target: str) -> str:
    return Path(target.split("#", 1)[0].split("?", 1)[0]).name


def extract_images(
    zf: zipfile.ZipFile,
    slide_part: str,
    slide_root: ET.Element,
    slide_rels: dict[str, Relationship],
    image_dir: Path,
    slide_number: int,
) -> list[dict[str, Any]]:
    raw_images: list[tuple[tuple[int, int], dict[str, Any]]] = []
    seen: set[str] = set()

    for pic_index, pic in enumerate(slide_root.findall(".//p:pic", NS), start=1):
        blip = pic.find(".//a:blip", NS)
        if blip is None:
            continue
        rel_id = blip.attrib.get(qn("r", "embed")) or blip.attrib.get(qn("r", "link"))
        if not rel_id or rel_id not in slide_rels:
            continue
        rel = slide_rels[rel_id]
        if rel.target_mode == "External":
            continue

        media_part = normalize_part_path(slide_part, rel.target)
        if media_part not in zf.namelist():
            continue
        source_name = target_filename(media_part)
        suffix = Path(source_name).suffix or ".bin"
        out_name = f"slide_{slide_number:03d}_image_{pic_index:02d}{suffix}"
        out_path = image_dir / out_name
        if media_part not in seen:
            out_path.write_bytes(zf.read(media_part))
            seen.add(media_part)
        image_data: dict[str, Any] = {
            "file": relpath_for_yaml(out_path, image_dir.parent),
        }
        size = image_size(out_path)
        if size:
            image_data["width_px"] = size[0]
            image_data["height_px"] = size[1]
        raw_images.append((read_order_key(pic), image_data))

    images = [image for _, image in sorted(raw_images, key=lambda item: item[0])]
    for index, image in enumerate(images, start=1):
        image["index"] = index
        ordered = {"index": image.pop("index"), "file": image["file"]}
        if "width_px" in image:
            ordered["width_px"] = image["width_px"]
        if "height_px" in image:
            ordered["height_px"] = image["height_px"]
        images[index - 1] = ordered
    return images


def image_size(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        return (int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big"))
    if data.startswith(b"\xff\xd8"):
        index = 2
        while index + 9 < len(data):
            if data[index] != 0xFF:
                index += 1
                continue
            marker = data[index + 1]
            index += 2
            if marker in (0xD8, 0xD9):
                continue
            if index + 2 > len(data):
                break
            length = int.from_bytes(data[index : index + 2], "big")
            if 0xC0 <= marker <= 0xC3 and index + 7 < len(data):
                height = int.from_bytes(data[index + 3 : index + 5], "big")
                width = int.from_bytes(data[index + 5 : index + 7], "big")
                return (width, height)
            index += length
    return None


def render_slide_screenshots(pptx_path: Path, screenshot_dir: Path) -> list[Path]:
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    pdftoppm = shutil.which("pdftoppm")
    if not soffice:
        raise RuntimeError("Cannot render screenshots: `soffice` or `libreoffice` was not found.")
    if not pdftoppm:
        return render_screenshots_with_single_slide_exports(pptx_path, screenshot_dir, soffice)

    screenshot_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="pptx-render-") as tmp:
        tmp_path = Path(tmp)
        profile_dir = tmp_path / "lo-profile"
        pdf_dir = tmp_path / "pdf"
        pdf_dir.mkdir()
        cmd = [
            soffice,
            f"-env:UserInstallation=file://{profile_dir}",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            str(pdf_dir),
            str(pptx_path),
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        pdfs = sorted(pdf_dir.glob("*.pdf"))
        if not pdfs:
            raise RuntimeError("LibreOffice did not produce a PDF for screenshot rendering.")

        prefix = screenshot_dir / "slide"
        cmd = [pdftoppm, "-png", "-r", "144", str(pdfs[0]), str(prefix)]
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        except subprocess.CalledProcessError:
            return render_screenshots_with_single_slide_exports(pptx_path, screenshot_dir, soffice)

    rendered = sorted(screenshot_dir.glob("slide-*.png"))
    for index, path in enumerate(rendered, start=1):
        normalized = screenshot_dir / f"slide_{index:03d}.png"
        if path != normalized:
            path.replace(normalized)
    return sorted(screenshot_dir.glob("slide_*.png"))


def single_slide_pptx(source_pptx: Path, dest_pptx: Path, keep_rel_id: str) -> None:
    with zipfile.ZipFile(source_pptx) as zin:
        presentation = read_xml(zin, "ppt/presentation.xml")
        slide_id_list = presentation.find("p:sldIdLst", NS)
        if slide_id_list is None:
            raise RuntimeError("Cannot find ppt/presentation.xml slide list.")
        for slide_id in list(slide_id_list):
            if slide_id.attrib.get(qn("r", "id")) != keep_rel_id:
                slide_id_list.remove(slide_id)

        with zipfile.ZipFile(dest_pptx, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for info in zin.infolist():
                data = zin.read(info.filename)
                if info.filename == "ppt/presentation.xml":
                    data = ET.tostring(presentation, encoding="utf-8", xml_declaration=True)
                zout.writestr(info, data)


def render_screenshots_with_single_slide_exports(
    pptx_path: Path,
    screenshot_dir: Path,
    soffice: str,
) -> list[Path]:
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(pptx_path) as zf:
        slide_refs = get_ordered_slide_refs(zf)
    if any(ref.rel_id is None for ref in slide_refs):
        raise RuntimeError("Cannot render screenshots without presentation slide relationship IDs.")

    rendered: list[Path] = []
    with tempfile.TemporaryDirectory(prefix="pptx-render-single-") as tmp:
        tmp_path = Path(tmp)
        profile_dir = tmp_path / "lo-profile"
        exports_dir = tmp_path / "exports"
        exports_dir.mkdir()
        for index, slide_ref in enumerate(slide_refs, start=1):
            one_slide = tmp_path / f"slide_{index:03d}.pptx"
            assert slide_ref.rel_id is not None
            single_slide_pptx(pptx_path, one_slide, slide_ref.rel_id)
            cmd = [
                soffice,
                f"-env:UserInstallation=file://{profile_dir}",
                "--headless",
                "--convert-to",
                "png",
                "--outdir",
                str(exports_dir),
                str(one_slide),
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            exported = exports_dir / f"slide_{index:03d}.png"
            if not exported.exists():
                candidates = sorted(exports_dir.glob("*.png"))
                if not candidates:
                    raise RuntimeError(f"LibreOffice did not render slide {index} to PNG.")
                exported = candidates[-1]
            final = screenshot_dir / f"slide_{index:03d}.png"
            shutil.move(str(exported), final)
            rendered.append(final)
    return rendered


def yaml_scalar(value: str) -> str:
    if value == "":
        return "''"
    if "\t" in value:
        escaped = (
            value.replace("\\", "\\\\")
            .replace('"', '\\"')
            .replace("\t", "\\t")
            .replace("\r", "\\r")
            .replace("\n", "\\n")
        )
        return f'"{escaped}"'
    if "\n" in value:
        lines = value.splitlines()
        if value.endswith("\n"):
            lines.append("")
        return "|\n" + "\n".join(f"  {line}" for line in lines)
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def to_yaml(value: Any, indent: int = 0) -> str:
    space = " " * indent
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return yaml_scalar(value)
    if isinstance(value, list):
        if not value:
            return "[]"
        lines: list[str] = []
        for item in value:
            if isinstance(item, (dict, list)):
                lines.append(f"{space}- {to_yaml(item, indent + 2).lstrip()}")
            else:
                lines.append(f"{space}- {to_yaml(item, indent + 2)}")
        return "\n".join(lines)
    if isinstance(value, dict):
        if not value:
            return "{}"
        lines = []
        for key, item in value.items():
            if isinstance(item, str) and "\n" in item:
                block = yaml_scalar(item).splitlines()
                lines.append(f"{space}{key}: {block[0]}")
                lines.extend(f"{space}{line}" for line in block[1:])
            elif isinstance(item, (dict, list)) and item:
                lines.append(f"{space}{key}:")
                lines.append(to_yaml(item, indent + 2))
            else:
                lines.append(f"{space}{key}: {to_yaml(item, indent + 2)}")
        return "\n".join(lines)
    return yaml_scalar(str(value))


def relpath_for_yaml(path: Path, base_dir: Path) -> str:
    return path.resolve().relative_to(base_dir.resolve()).as_posix()


def dot_relpath_for_yaml(path: Path, base_dir: Path) -> str:
    return f"./{relpath_for_yaml(path, base_dir)}"


def analyze_pptx(pptx_path: Path, output_yaml: Path, render_screenshots: bool) -> dict[str, Any]:
    out_dir = output_yaml.parent
    image_dir = out_dir / "images"
    screenshot_dir = out_dir / "screenshots"
    image_dir.mkdir(parents=True, exist_ok=True)
    screenshot_dir.mkdir(parents=True, exist_ok=True)

    screenshots: list[Path] = []
    screenshot_error: str | None = None
    if render_screenshots:
        try:
            screenshots = render_slide_screenshots(pptx_path, screenshot_dir)
        except Exception as exc:  # Keep extraction useful even without renderer.
            screenshot_error = str(exc)

    slides: list[dict[str, Any]] = []
    with zipfile.ZipFile(pptx_path) as zf:
        slide_parts = get_ordered_slide_parts(zf)
        for slide_number, slide_part in enumerate(slide_parts, start=1):
            slide_root = read_xml(zf, slide_part)
            rels_path = (
                str(Path(slide_part).parent / "_rels" / f"{Path(slide_part).name}.rels")
                .replace("\\", "/")
            )
            slide_rels = read_relationships(zf, rels_path)
            screenshot_file = None
            if slide_number <= len(screenshots):
                screenshot_file = dot_relpath_for_yaml(screenshots[slide_number - 1], out_dir)

            slide_data: dict[str, Any] = {
                "number": slide_number,
                "screenshot": screenshot_file,
                "texts": extract_text_blocks(slide_root),
                "images": extract_images(
                    zf=zf,
                    slide_part=slide_part,
                    slide_root=slide_root,
                    slide_rels=slide_rels,
                    image_dir=image_dir,
                    slide_number=slide_number,
                ),
            }
            slides.append(slide_data)

    result: dict[str, Any] = {
        "slide_count": len(slides),
        "slides": slides,
    }
    if screenshot_error:
        result["screenshot_error"] = screenshot_error
    return result


def default_output_yaml(pptx_path: Path) -> Path:
    parts = pptx_path.resolve().parts
    if "courses" in parts:
        course_index = parts.index("courses") + 1
        if course_index < len(parts):
            course_root = Path(*parts[: course_index + 1])
            return course_root / "pptx-analysis" / pptx_path.stem / f"{pptx_path.stem}.yaml"

    return DEFAULT_OUTPUT_ROOT / pptx_path.stem / f"{pptx_path.stem}.yaml"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analyze a PPTX into YAML with formatted text, embedded images, and slide screenshots."
    )
    parser.add_argument("pptx", type=Path, help="Source .pptx file, e.g. courses/giao_duc_phap_luat/source-ppt/bai_01.pptx")
    parser.add_argument(
        "-o",
        "--out",
        type=Path,
        help="Output YAML path. Default: courses/giao_duc_phap_luat/pptx-analysis/<deck>/<deck>.yaml",
    )
    parser.add_argument(
        "--no-screenshots",
        action="store_true",
        help="Skip LibreOffice/Poppler screenshot rendering.",
    )
    args = parser.parse_args()

    pptx_path = args.pptx.resolve()
    if not pptx_path.exists():
        print(f"Missing PPTX file: {pptx_path}", file=sys.stderr)
        return 1
    if pptx_path.suffix.lower() != ".pptx":
        print(f"Expected a .pptx file: {pptx_path}", file=sys.stderr)
        return 1

    output_yaml = (args.out.resolve() if args.out else default_output_yaml(pptx_path).resolve())
    output_yaml.parent.mkdir(parents=True, exist_ok=True)

    analysis = analyze_pptx(
        pptx_path=pptx_path,
        output_yaml=output_yaml,
        render_screenshots=not args.no_screenshots,
    )
    output_yaml.write_text(to_yaml(analysis) + "\n", encoding="utf-8")
    print(output_yaml)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
