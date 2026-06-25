const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const course = process.env.COURSE || process.argv[2] || "giao_duc_phap_luat";
const courseRoot = path.join(root, "courses", course);
const slidesDir = path.join(courseRoot, "md_slides");
const marpBin = path.join(root, "node_modules", ".bin", "marp");

if (!fs.existsSync(slidesDir)) {
  console.error(`Missing course slide directory: ${path.relative(root, slidesDir)}`);
  process.exit(1);
}

function buildTheme() {
  const result = spawnSync(process.execPath, [path.join(root, "tools", "build_marp_theme.js")], {
    cwd: root,
    stdio: "inherit",
  });

  return result.status === 0;
}

if (!buildTheme()) {
  process.exit(1);
}

const marp = spawn(
  marpBin,
  [
    "--server",
    "--input-dir",
    path.relative(root, slidesDir),
    "--theme",
    "./template/theme.css",
    "--engine",
    "./engine.js",
    "--watch",
  ],
  { cwd: root, stdio: "inherit" }
);

let timeout;
const scheduleBuild = (filename = "") => {
  if (filename.endsWith("theme.css") || filename.endsWith(".theme.tailwind.css")) {
    return;
  }

  clearTimeout(timeout);
  timeout = setTimeout(buildTheme, 150);
};

for (const dir of [slidesDir, path.join(root, "template")]) {
  fs.watch(dir, { recursive: true }, (_event, filename) => {
    scheduleBuild(filename ? String(filename) : "");
  });
}

const shutdown = () => {
  marp.kill("SIGTERM");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
marp.on("exit", (code) => process.exit(code ?? 0));
