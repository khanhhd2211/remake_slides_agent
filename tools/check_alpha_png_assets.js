#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function printUsage() {
  console.log(`Usage:
  node tools/check_alpha_png_assets.js --course giao_duc_chinh_tri --deck bai_03
  node tools/check_alpha_png_assets.js --assets courses/giao_duc_chinh_tri/assets --mdx courses/giao_duc_chinh_tri/md_slides/bai_03.mdx

Options:
  --course <id>       Course id. Default: giao_duc_chinh_tri.
  --deck <deck>       Deck name without extension. Default: bai_01.
  --assets <dir>      Assets directory override.
  --mdx <file>        MDX file override. Used to mark whether the asset is referenced.
  --used-only         Print only alpha PNG files referenced by the MDX deck.
  --prefix <prefix>   Filter filenames by prefix. Defaults to deck prefix, e.g. bai_03_.
  --json              Print machine-readable JSON.
`);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function readUInt32(buffer, offset) {
  return buffer.readUInt32BE(offset);
}

function inspectPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) return null;

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = null;
  let hasTransparencyChunk = false;

  while (offset + 12 <= buffer.length) {
    const length = readUInt32(buffer, offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const dataOffset = offset + 8;

    if (type === "IHDR") {
      width = readUInt32(buffer, dataOffset);
      height = readUInt32(buffer, dataOffset + 4);
      colorType = buffer[dataOffset + 9];
    } else if (type === "tRNS") {
      hasTransparencyChunk = true;
    } else if (type === "IEND") {
      break;
    }

    offset = dataOffset + length + 4;
  }

  const hasAlpha = colorType === 4 || colorType === 6 || hasTransparencyChunk;
  return { width, height, colorType, hasAlpha };
}

function mdxReferences(mdxPath) {
  if (!mdxPath || !fs.existsSync(mdxPath)) return new Set();
  const source = fs.readFileSync(mdxPath, "utf8");
  const refs = new Set();
  for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    refs.add(path.basename(match[1]));
  }
  return refs;
}

function slideFromName(file) {
  const match = file.match(/_s(\d{3})_/);
  return match ? Number(match[1]) : null;
}

function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printUsage();
    return;
  }

  const course = arg("--course", process.env.COURSE || "giao_duc_chinh_tri");
  const deck = (arg("--deck", process.env.DECK || "bai_01") || "").replace(/\.(mdx|md|html)$/, "");
  const assetsDir = path.resolve(root, arg("--assets", path.join("courses", course, "assets")));
  const mdxPath = path.resolve(root, arg("--mdx", path.join("courses", course, "md_slides", `${deck}.mdx`)));
  const prefix = arg("--prefix", `${deck}_`);
  const usedOnly = hasFlag("--used-only");
  const asJson = hasFlag("--json");

  if (!fs.existsSync(assetsDir)) {
    console.error(`Missing assets directory: ${path.relative(root, assetsDir)}`);
    process.exit(1);
  }

  const refs = mdxReferences(mdxPath);
  const files = walk(assetsDir)
    .filter((filePath) => filePath.toLowerCase().endsWith(".png"))
    .filter((filePath) => path.basename(filePath).startsWith(prefix));

  const findings = files.flatMap((filePath) => {
    const meta = inspectPng(filePath);
    if (!meta?.hasAlpha) return [];

    const file = path.basename(filePath);
    const used = refs.has(file);
    if (usedOnly && !used) return [];

    return [{
      slide: slideFromName(file),
      file,
      used,
      width: meta.width,
      height: meta.height,
      colorType: meta.colorType,
      path: path.relative(root, filePath),
    }];
  }).sort((a, b) => (a.slide || 0) - (b.slide || 0) || a.file.localeCompare(b.file));

  if (asJson) {
    console.log(JSON.stringify({ assetsDir: path.relative(root, assetsDir), mdx: path.relative(root, mdxPath), findings }, null, 2));
    process.exit(findings.length ? 2 : 0);
  }

  if (!findings.length) {
    console.log(`OK: no alpha PNG assets found for prefix "${prefix}".`);
    return;
  }

  const usedCount = findings.filter((item) => item.used).length;
  console.log(
    `Alpha PNG assets found: ${findings.length} total, ${usedCount} referenced by ` +
      `${path.relative(root, mdxPath)}.\n`,
  );

  for (const item of findings) {
    const slide = item.slide ? `slide ${item.slide}` : "slide ?";
    const mark = item.used ? "USED" : "unused";
    console.log(`- ${slide}: ${item.file} (${item.width}x${item.height}, ${mark})`);
  }

  process.exit(findings.length ? 2 : 0);
}

main();
