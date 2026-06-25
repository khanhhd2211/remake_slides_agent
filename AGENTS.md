# Repository Guidelines

## Project Structure & Module Organization

This repository converts course PowerPoint decks into Marp-based slide decks and supports multiple subjects under `courses/`.

- `courses/<course_id>/source-ppt/` stores original `.pptx` files such as `bai_01.pptx`.
- `courses/<course_id>/md_slides/` contains editable Marp MDX decks for each subject.
- `courses/<course_id>/assets/` holds images referenced by that subject's slides.
- `courses/<course_id>/pptx-analysis/` stores extracted PPTX structure.
- `courses/<course_id>/output/` stores generated decks and rendered exports.
- `template/` contains shared slide assets for conversion: `theme.source.css`, generated `theme.css`, layout snippets, and prompt guidance.
- `tools/` contains Node and Python utilities for theme building, previewing, PPTX analysis, rendering, and cleanup.

## Build, Test, and Development Commands

Install dependencies with:

```sh
npm install
```

Common commands:

- `npm run build:css` builds `template/theme.css` from the Tailwind source theme.
- `npm run watch:css` rebuilds the theme when template sources change.
- `npm run preview` starts the Marp preview server for `courses/giao_duc_phap_luat/md_slides/`.
- `COURSE=course_a npm run preview` previews another course.
- `COURSE=course_a DECK=bai_01 npm run html` renders MDX components, builds CSS, and exports one deck to HTML.
- `python3 tools/render_output_slides.py --course course_a --dry-run` checks PPTX render commands.
- `python3 tools/render_output_slides.py --course course_a --only bai_04` renders selected output decks.

## Coding Style & Naming Conventions

Use CommonJS for legacy Node scripts and ESM for MDX tooling. Prefer `const`, double quotes, 2-space indentation, and explicit `path.join` or `Path` handling for repository paths. Python scripts should use standard-library-first code, type hints where useful, `argparse` for CLIs, and `snake_case` names. Name courses with lowercase snake case, for example `giao_duc_phap_luat`, and lesson files as `bai_XX.mdx` or `bai_XX.pptx`.

Slide sizing is tuned visually, so arbitrary Tailwind values are allowed when they preserve the deck layout. Prefer explicit values such as `h-[430px]`, `gap-[52px]`, `px-[18px]`, and `text-[20px]` over nearby scale aliases if the alias changes the rendered size. Tailwind IntelliSense canonical warnings are acceptable in slide and component MDX files. Use shared CSS variables where helpful, for example `bg-[var(--red)]`, `text-[var(--muted)]`, and `border-[var(--line)]`.

## Testing Guidelines

There is no formal test suite yet. Validate changes through the relevant command: rebuild CSS after template edits, run `npm run preview` for slide layout checks, and use `--dry-run` before batch rendering. For Python utilities, test a narrow case first with flags such as `--only bai_04` before processing all decks.

## Commit & Pull Request Guidelines

This repository currently has no commit history, so no project-specific commit convention is established. Use short imperative commit messages, for example `Add lesson 04 Marp deck` or `Fix theme pagination spacing`. Pull requests should describe the changed lessons or tools, list validation commands run, and include screenshots or exported previews for visual slide changes.

## Agent-Specific Instructions

Keep generated artifacts separate from source edits when possible. Do not overwrite original files in any `courses/<course_id>/source-ppt/` directory. Keep `template/theme.source.css` focused on shared tokens, typography, and base Marp styling. Put reusable UI in `components/*.mdx`, and put per-slide layout directly in the course `.mdx` deck with Tailwind classes. Regenerate `template/theme.css` with `npm run build:css` after theme changes.
