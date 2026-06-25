# Repository Guidelines

## Purpose

This repository remakes course PowerPoint lessons into Marp MDX slide decks. AI agents must preserve the learning content, study the original slide design, and rebuild slides thoughtfully with reusable MDX components plus Tailwind utilities.

## Project Structure

- `courses/<course_id>/source-ppt/` stores original `.pptx` files. Do not edit these files.
- `courses/<course_id>/pptx-analysis/<deck>/` stores extracted YAML, screenshots, and embedded images.
- `courses/<course_id>/md_slides/` contains editable Marp MDX decks such as `bai_01.mdx`.
- `courses/<course_id>/assets/` contains final images used by the remade deck.
- `components/*.mdx` contains reusable UI primitives such as cards, logos, quotes, and module blocks.
- `template/theme.source.css` defines shared tokens, typography, and Marp base styles. Run `npm run build:css` after changing it.
- `tools/` contains extraction, MDX rendering, preview, export, and cleanup scripts.

## Required PPTX Analysis Workflow

Never read or parse `.pptx` files directly from `source-ppt/`. Always create or use extracted analysis first.

If `courses/<course_id>/pptx-analysis/<deck>/<deck>.yaml` is missing, run:

```sh
python3 tools/extract_pptx_structure.py courses/giao_duc_chinh_tri/source-ppt/bai_01.pptx
```

The extractor creates:

- `<deck>.yaml` with slide text, image metadata, and screenshot references.
- `screenshots/slide_001.jpg` style previews of the original slide.
- `images/slide_001_image_01.jpg` style embedded image exports.

For token efficiency, do not load the full YAML for large decks. Use:

```sh
python3 tools/slide_yaml_slice.py courses/giao_duc_chinh_tri/pptx-analysis/bai_02/bai_02.yaml --slides 1,4,7-9 --paths
```

Each YAML slide contains `number`, `screenshot`, `texts`, and `images`. Resolve screenshot and image paths relative to the YAML folder. Always inspect the `screenshot` image before remaking the slide so the visual hierarchy, spacing, and intended layout are understood.

## How To Use YAML Content

Use `texts` as content source, not as automatic layout instructions. Important fields:

- `index` preserves approximate reading/order.
- `font_size_pt` helps identify titles, body text, captions, and emphasis.
- `text` may contain Markdown markers such as `**bold**` or multi-line text blocks.

Use `images` only after checking relevance and quality:

- `file` points to the extracted image.
- `width_px` and `height_px` help identify logos, decorative icons, diagrams, or photos.
- Some extracted images are meaningless artifacts, cropped decorations, or low-quality fragments.

Do not insert text and images mechanically. Match each image to related text and the original screenshot. If an image does not support the slide message, omit it or replace it with a better course asset. Never insert an image without reviewing its visual quality and meaning.

## MDX Slide Writing

Write source slides in `courses/<course_id>/md_slides/bai_XX.mdx`. Use JSX-style attributes:

```mdx
<Card className="min-h-[200px]">
  <div className="text-xl font-bold leading-tight text-[var(--red)]">ĐG chuyên&nbsp;cần</div>
</Card>
```

Use `className`, not `class`. Self-close image tags and components when empty: `<DeckLogo />`, `<img src="../assets/logo.png" alt="Logo" />`.

Do not use `h3` tags for card titles, labels, diagram nodes, captions, or small section headings inside a slide. Marp theme heading rules can change margins, font size, and auto-scaling in ways that shift layouts. Use `div` or `span` with explicit Tailwind text utilities instead, such as `text-sm`, `text-lg`, `text-xl`, `font-bold`, and `leading-tight`. Reserve semantic headings for actual slide-level structure, usually `h2` for the main slide title.

Use arbitrary Tailwind values when the visual match needs exact sizing, for example `text-[20px]`, `gap-[14px]`, `min-h-[248px]`, or `px-[18px]`. Do not blindly accept Tailwind IntelliSense canonical suggestions if they change the rendered size.

Avoid raw Markdown list syntax inside JSX children unless a list is intended. Text like `1. Vị trí...` may become an ordered list; escape it as `1\. Vị trí...` or place it in a prop/string when needed.

## Component Guidance

Use existing components for repeated visual primitives: `Card`, `DeckLogo`, `Kicker`, `MediaCard`, `ModuleCard`, `PillItem`, `QuestionCard`, `QuoteBox`, `StatCard`, and `ThanksCard`.

The repository already provides standard templates for the first and last slides. Use `CoverSlide` for the opening lesson information slide and `ThanksCard` for the final thank-you/contact slide. Do not recreate these two layouts manually unless the user explicitly asks for a different design.

Create new `components/*.mdx` only for reusable styled elements. Avoid creating layout components such as fixed grids or fixed slide templates. Slide layout should stay flexible inside `bai_*.mdx` using Tailwind classes directly, because each original PPT slide may need a different composition.

Component styles should be mostly Tailwind classes and CSS variables. Keep global CSS limited to shared tokens, type scale, Marp defaults, and small base rules.

## Design Quality Rules

Remake the intent, not just the objects. Before writing a slide:

- View the original screenshot.
- Read only the relevant YAML slide block.
- Identify title, body hierarchy, supporting visuals, and decorative elements.
- Decide what to keep, simplify, replace, or omit.

Never place unrelated text next to an image. Never copy a poor extracted image just because it exists in YAML. Check that the final slide is readable, aligned, and not overflowing. If content is long, redesign with cards, columns, steps, or split slides instead of shrinking everything blindly.

## Non-Negotiable Fidelity Rules

The remade deck must keep the same number of slides as the source lesson unless the user explicitly approves splitting or merging slides. Every source slide must have a corresponding remade slide, and the information from each slide must not be dropped, moved to the wrong context, or changed in meaning.

Do not omit required content. You may rephrase lightly for readability, add small clarifying labels, or improve visual grouping, but do not add unsupported facts, extra claims, or decorative text that changes the lesson meaning. Extra design elements are acceptable only when they support the existing content.

Images must preserve their important details. Do not crop an image in a way that removes meaningful information, labels, people, diagrams, icons, or context. Prefer `object-contain`, full-image framing, or a redesigned layout over `object-cover` when the image carries content. If a crop is purely decorative, confirm that no useful information is lost.

After placing each image, review the rendered slide and compare it with the original screenshot. The image must be clear enough to understand, visually related to nearby text, and not stretched, blurred, clipped, or hidden behind other elements.

Use `tools/card_bg_color.py` to choose image-card backgrounds for `object-contain` images or images with visible letterboxing. Run it on the final asset path, preferably with `--ignore-white`, then pass the suggested hex color to `MediaCard` via `bgColor`, for example:

```sh
python3 tools/card_bg_color.py courses/giao_duc_chinh_tri/assets/bai_02_s098_image_01.jpg --ignore-white
```

```mdx
<MediaCard
  className="h-[220px]"
  contain
  src="../assets/bai_02_s098_image_01.jpg"
  bgColor="#D8D1C6"
  alt="Minh họa hoạt động sản xuất vật chất"
/>
```

Use `tools/avoid_widows.py` before final render to reduce orphan words in supported text tags (`p`, `li`, headings, `span`, and captions). Run it on the edited deck, and on fragments too if fragments are kept as source material:

```sh
python3 tools/avoid_widows.py courses/giao_duc_chinh_tri/md_slides/bai_02.mdx
```

After running either tool, rerender the deck and visually check affected slides. Tool output is a starting point, not a substitute for layout review.

## Development Commands

Install dependencies:

```sh
npm install
```

Common commands:

- `npm run build:css` builds `template/theme.css`.
- `npm run watch:css` watches theme changes.
- `npm run preview` previews the default course deck folder.
- `COURSE=giao_duc_chinh_tri DECK=bai_01 npm run html` renders MDX components and exports HTML.
- VS Code task `Marp: dev` starts both MDX cache rendering and Tailwind theme watching.

Restart watch tasks after editing tools or component-loading logic.

## Large Deck Workflow

For many slides, split work into ranges and use subagents when available. Give each subagent a small slide range, the YAML slice command, and the requirement to inspect screenshots. Merge results manually into one `bai_XX.mdx` and keep component usage consistent.

Validate often with Marp preview. For visual changes, inspect the rendered slide, fix overflow and spacing, then rerun the relevant render command.
