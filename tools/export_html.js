const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const course = process.env.COURSE || process.argv[2] || "giao_duc_phap_luat";
const deck = (process.env.DECK || process.argv[3] || "bai_01").replace(/\.md$/, "");
const input = path.join(root, "courses", course, "md_slides", `${deck}.md`);
const output = path.join(root, "courses", course, "md_slides", `${deck}.html`);
const marpBin = path.join(root, "node_modules", ".bin", "marp");

if (!fs.existsSync(input)) {
  console.error(`Missing deck: ${path.relative(root, input)}`);
  process.exit(1);
}

const result = spawnSync(
  marpBin,
  [
    input,
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
