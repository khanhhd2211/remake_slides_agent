# Components

Reusable slide components live in `slide-components.mjs`. Write component tags directly in `.mdx` decks, then run `npm run html`; the build renders MDX components into `.marp-cache/` before Marp converts the deck.

## Cover Slide

Use with `<!-- _class: cover -->`.

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

```html
<!-- _class: relative grid place-items-center p-0 bg-[var(--navy)] -->
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

Optional props: `logoSrc`, `logoAlt`, `title`, `address`, `hotline`, `email`, `website`.

## Styling

Component CSS is split into `deck-logo.css`, `cover.css`, and `content.css`, then imported by `template/theme.source.css`. Keep layout decisions in MDX with Tailwind classes; keep repeated UI structure in MDX components.
