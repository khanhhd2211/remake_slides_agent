const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const course = process.env.COURSE || process.argv[2] || "giao_duc_phap_luat";
const deck = (process.env.DECK || process.argv[3] || "bai_01").replace(/\.(mdx|md)$/, "");
const slidesDir = path.join(root, "courses", course, "md_slides");
const mdxInput = path.join(slidesDir, `${deck}.mdx`);
const mdInput = path.join(slidesDir, `${deck}.md`);
const input = fs.existsSync(mdxInput) ? mdxInput : mdInput;
const renderedInput = path.join(root, ".marp-cache", course, "md_slides", `${deck}.md`);
const output = path.join(root, "courses", course, "md_slides", `${deck}.html`);
const marpBin = path.join(root, "node_modules", ".bin", "marp");

if (!fs.existsSync(input)) {
  console.error(`Missing deck: ${path.relative(root, input)}`);
  process.exit(1);
}

const renderResult = spawnSync(
  process.execPath,
  [path.join(root, "tools", "render_mdx.mjs"), "--course", course, "--deck", deck],
  { cwd: root, stdio: "inherit" }
);

if (renderResult.status !== 0) {
  process.exit(renderResult.status ?? 1);
}

const result = spawnSync(
  marpBin,
  [
    renderedInput,
    "--theme",
    path.join(root, "template", "theme.css"),
    "--engine",
    path.join(root, "engine.js"),
    "-o",
    output,
  ],
  { cwd: root, stdio: "inherit" }
);

process.exit(result.status ?? 0);
