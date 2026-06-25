const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const input = path.join(root, "template", "theme.source.css");
const output = path.join(root, "template", "theme.css");
const tempOutput = path.join(root, "template", ".theme.tailwind.css");
const tailwindBin = path.join(root, "node_modules", ".bin", "tailwindcss");

function buildTheme() {
  const result = spawnSync(tailwindBin, ["-i", input, "-o", tempOutput], {
    cwd: root,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    return false;
  }

  const css = fs.readFileSync(tempOutput, "utf8");
  const marpHeader = [
    "/* @theme tailwind */",
    '@import "default";',
    "",
  ].join("\n");

  fs.writeFileSync(output, `${marpHeader}${css}`);
  fs.rmSync(tempOutput, { force: true });
  return true;
}

if (!buildTheme()) {
  process.exit(1);
}

if (!process.argv.includes("--watch")) {
  process.exit(0);
}

let timeout;
const scheduleBuild = (filename = "") => {
  if (filename.endsWith("theme.css") || filename.endsWith(".theme.tailwind.css")) {
    return;
  }

  clearTimeout(timeout);
  timeout = setTimeout(buildTheme, 150);
};

for (const dir of ["courses", "template", "components"]) {
  fs.watch(path.join(root, dir), { recursive: true }, (_event, filename) => {
    scheduleBuild(filename ? String(filename) : "");
  });
}

console.log("Watching Marp Tailwind sources...");
