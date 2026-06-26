const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const course = process.env.COURSE || process.argv[2] || "giao_duc_chinh_tri";
const courseRoot = path.join(root, "courses", course);
const slidesDir = path.join(courseRoot, "md_slides");
const renderedCourseDir = path.join(root, ".marp-cache", course);
const renderedSlidesDir = path.join(renderedCourseDir, "md_slides");
const marpBin = path.join(root, "node_modules", ".bin", "marp");
const tailwindBin = path.join(root, "node_modules", ".bin", "tailwindcss");
const themeSource = path.join(root, "template", "theme.source.css");
const previewThemeSource = path.join(renderedCourseDir, "theme.preview.source.css");
const previewThemeTemp = path.join(renderedCourseDir, ".theme.preview.tailwind.css");
const previewTheme = path.join(renderedCourseDir, "theme.preview.css");

if (!fs.existsSync(slidesDir)) {
  console.error(`Missing course slide directory: ${path.relative(root, slidesDir)}`);
  process.exit(1);
}

function deckNameOf(deck) {
  return deck.replace(/\.(mdx|md)$/, "");
}

function newestDeck() {
  const decks = fs
    .readdirSync(slidesDir)
    .filter((name) => name.endsWith(".mdx") || name.endsWith(".md"))
    .map((name) => {
      const file = path.join(slidesDir, name);
      return { name: deckNameOf(name), mtimeMs: fs.statSync(file).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return decks[0]?.name || "bai_01";
}

const deck = deckNameOf(process.env.DECK || process.argv[3] || newestDeck());
const mdxInput = path.join(slidesDir, `${deck}.mdx`);
const mdInput = path.join(slidesDir, `${deck}.md`);
const deckInput = fs.existsSync(mdxInput) ? mdxInput : mdInput;

if (!fs.existsSync(deckInput)) {
  console.error(`Missing deck: ${path.relative(root, deckInput)}`);
  process.exit(1);
}

function buildPreviewTheme() {
  fs.mkdirSync(renderedCourseDir, { recursive: true });

  const scopedSource = fs.readFileSync(themeSource, "utf8").replace(
    /@source\s+"[^"]+";\n/g,
    [
      `@source "../../courses/${course}/md_slides/${deck}.mdx";`,
      `@source "../../components/**/*.mdx";`,
      `@source "../../template/**/*.md";`,
    ].join("\n") + "\n",
  );

  fs.writeFileSync(previewThemeSource, scopedSource);

  const result = spawnSync(tailwindBin, ["-i", previewThemeSource, "-o", previewThemeTemp], {
    cwd: root,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    return false;
  }

  const css = fs.readFileSync(previewThemeTemp, "utf8");
  fs.writeFileSync(previewTheme, `/* @theme tailwind */\n@import "default";\n\n${css}`);
  fs.rmSync(previewThemeTemp, { force: true });
  return true;
}

function renderDeck({ syncAssets = false } = {}) {
  const args = [
    path.join(root, "tools", "render_mdx.mjs"),
    "--course",
    course,
    "--deck",
    deck,
  ];

  if (!syncAssets) {
    args.push("--skip-assets");
  }

  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });

  return result.status === 0;
}

if (!renderDeck({ syncAssets: true }) || !buildPreviewTheme()) {
  process.exit(1);
}

const marp = spawn(
  marpBin,
  [
    "--server",
    "--input-dir",
    path.relative(root, renderedCourseDir),
    "--theme",
    path.relative(root, previewTheme),
    "--engine",
    "./engine.js",
    "--watch",
  ],
  { cwd: root, stdio: "inherit" },
);

console.log(`Previewing ${course}/${deck}: http://localhost:${process.env.PORT || 8080}/md_slides/${deck}.md`);

let renderTimeout;
let themeTimeout;
let assetTimeout;

function scheduleRender({ rebuildTheme = true } = {}) {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    if (renderDeck({ syncAssets: false }) && rebuildTheme) {
      scheduleThemeBuild();
    }
  }, 450);
}

function scheduleThemeBuild() {
  clearTimeout(themeTimeout);
  themeTimeout = setTimeout(() => {
    buildPreviewTheme();
  }, 650);
}

function scheduleAssetSync() {
  clearTimeout(assetTimeout);
  assetTimeout = setTimeout(() => {
    renderDeck({ syncAssets: true });
  }, 900);
}

fs.watch(slidesDir, (_event, filename) => {
  const name = filename ? String(filename) : "";

  if (name === `${deck}.mdx` || name === `${deck}.md`) {
    scheduleRender({ rebuildTheme: true });
  }
});

for (const dir of [path.join(root, "components"), path.join(root, "template")]) {
  fs.watch(dir, { recursive: true }, (_event, filename) => {
    const name = filename ? String(filename) : "";

    if (name.endsWith("theme.css") || name.endsWith(".theme.tailwind.css")) {
      return;
    }

    scheduleRender({ rebuildTheme: true });
  });
}

const assetsDir = path.join(courseRoot, "assets");
if (fs.existsSync(assetsDir)) {
  fs.watch(assetsDir, { recursive: true }, scheduleAssetSync);
}

const shutdown = () => {
  marp.kill("SIGTERM");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
marp.on("exit", (code) => process.exit(code ?? 0));
