# Components

Reusable slide components live as `.mdx` files in this folder. Write component tags directly in course `.mdx` decks, then run `npm run html`; the build renders MDX components into `.marp-cache/` before Marp converts the deck.

File names become component names automatically:

- `cover-slide.mdx` -> `<CoverSlide />`
- `card.mdx` -> `<Card />`
- `deck-logo.mdx` -> `<DeckLogo />`
- `kicker.mdx` -> `<Kicker />`
- `thanks-card.mdx` -> `<ThanksCard />`

## Cover Slide

Use with a Marp directive in MDX:

```mdx
{/* _class: relative grid place-items-center overflow-hidden bg-[#151515] p-0 */}
{/* _paginate: false */}
```

```html
<CoverSlide
  lesson="Bài 1"
  title="Môn Giáo dục chính trị"
  school="Trường Trung Cấp Công Nghệ Hà Nội"
  website="trungcapcongnghehanoi.edu.vn"
/>
```

Optional props: `logoSrc`, `logoAlt`, `background`.

## Deck Logo

```html
<DeckLogo />
<DeckLogo position="top-left" />
```

Optional props: `src`, `alt`, `position`.

## Thanks Card

Use on a final slide with:

```mdx
{/* _class: relative grid place-items-center overflow-hidden bg-[var(--navy)] p-0 */}
```

```html
<ThanksCard
  school="Trường Trung Cấp Công Nghệ Hà Nội"
  address="Tầng 4, Trung tâm Văn hóa Nghệ thuật, đường Mai Dịch, quận Cầu Giấy, Hà Nội"
  hotline="0933.279.868"
  email="trungcapcongnghehanoi.edu.vn@gmail.com"
  website="trungcapcongnghehanoi.edu.vn"
/>
```

Optional props: `logoSrc`, `logoAlt`, `background`, `title`, `address`, `hotline`, `email`, `website`.

## Styling

Components are styled with Tailwind classes directly inside `.mdx` files. Keep layout decisions in course MDX with Tailwind classes; keep repeated UI structure in component MDX files.

Use Tailwind classes directly, and keep exact arbitrary values when the slide layout depends on them:

- Prefer exact slide values such as `h-[430px]`, `gap-[52px]`, `px-[18px]`, `py-[22px]`, `text-[20px]` when matching an existing design.
- Tailwind IntelliSense canonical warnings are acceptable in `.mdx` slide/component files.
- Use CSS variables with arbitrary syntax such as `bg-[var(--red)]`, `text-[var(--muted)]`, `border-[var(--line)]`.
- Keep arbitrary values for grid ratios, exact colors, gradients, shadows, and any spacing or type size that must match the original deck.
