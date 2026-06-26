#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const puppeteer = require("puppeteer-core");

const root = path.resolve(__dirname, "..");

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function findBrowser(explicit) {
  const candidates = [
    explicit,
    process.env.BROWSER_PATH,
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function resolveHtml() {
  const html = arg("--html");
  if (html) return path.resolve(root, html);

  const course = arg("--course", process.env.COURSE || "giao_duc_chinh_tri");
  const deck = (arg("--deck", process.env.DECK || "bai_01") || "").replace(/\.(mdx|md|html)$/, "");
  return path.join(root, "courses", course, "md_slides", `${deck}.html`);
}

function renderHtmlIfRequested(htmlPath) {
  if (!hasFlag("--render")) return;

  const course = arg("--course", process.env.COURSE || "giao_duc_chinh_tri");
  const deck = (arg("--deck", process.env.DECK || "bai_01") || "").replace(/\.(mdx|md|html)$/, "");
  const result = spawnSync("npm", ["run", "html"], {
    cwd: root,
    env: { ...process.env, COURSE: course, DECK: deck },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (!fs.existsSync(htmlPath)) {
    console.error(`Rendered HTML was not found: ${path.relative(root, htmlPath)}`);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`Usage:
  node tools/check_slide_overflow.js --course giao_duc_chinh_tri --deck bai_03
  node tools/check_slide_overflow.js --html courses/giao_duc_chinh_tri/md_slides/bai_03.html

Options:
  --render              Run npm run html before checking.
  --threshold <px>      Allowed bleed before reporting. Default: 2.
  --max-offenders <n>   Max offenders printed per slide. Default: 8.
  --browser-path <path> Browser executable. Defaults to Brave/Chrome/Edge lookup.
  --json                Print machine-readable JSON.
`);
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printUsage();
    return;
  }

  const htmlPath = resolveHtml();
  renderHtmlIfRequested(htmlPath);

  if (!fs.existsSync(htmlPath)) {
    console.error(`Missing HTML file: ${path.relative(root, htmlPath)}`);
    console.error("Run with --render, or render first with COURSE=<course> DECK=<deck> npm run html.");
    process.exit(1);
  }

  const browserPath = findBrowser(arg("--browser-path"));
  if (!browserPath) {
    console.error("Could not find Brave/Chrome/Edge. Pass --browser-path <executable>.");
    process.exit(1);
  }

  const threshold = Number(arg("--threshold", "2"));
  const maxOffenders = Number(arg("--max-offenders", "8"));
  const asJson = hasFlag("--json");

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--allow-file-access-from-files"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images]
          .filter((img) => !img.complete)
          .map((img) => new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })),
      );
      if (document.fonts?.ready) await document.fonts.ready;
    });

    await page.addStyleTag({
      content: `
        body { overflow: visible !important; background: white !important; }
        svg.bespoke-marp-slide, svg[data-marpit-svg] {
          content-visibility: visible !important;
          display: block !important;
          height: 720px !important;
          left: 0 !important;
          margin: 0 !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          position: relative !important;
          top: 0 !important;
          width: 1280px !important;
          z-index: auto !important;
        }
      `,
    });

    const report = await page.evaluate(({ threshold, maxOffenders }) => {
      const slideNodes = [
        ...document.querySelectorAll("svg[data-marpit-svg], svg.bespoke-marp-slide"),
      ];

      function textOf(el) {
        return (el.innerText || el.alt || el.getAttribute("aria-label") || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 120);
      }

      function selectorOf(el) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const classes = typeof el.className === "string"
          ? el.className
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 4)
              .map((name) => `.${name.replace(/[^a-zA-Z0-9_-]/g, "\\$&")}`)
              .join("")
          : "";
        return `${tag}${id}${classes}`;
      }

      function isIgnored(el) {
        const cls = typeof el.className === "string" ? el.className : "";
        const tag = el.tagName.toLowerCase();

        if (["script", "style", "defs", "clipPath"].includes(tag)) return true;
        if (el.closest("[data-overflow-ok], [data-overflow-ignore]")) return true;

        // Full-bleed blurred backgrounds are intentionally larger than the slide.
        if (cls.includes("inset-[-") && (cls.includes("blur") || cls.includes("bg-cover"))) {
          return true;
        }

        return false;
      }

      const slides = slideNodes.map((svg, index) => {
        const section = svg.querySelector("section");
        const slideBox = (section || svg).getBoundingClientRect();
        const offenders = [];

        for (const el of [...(section || svg).querySelectorAll("*")]) {
          if (isIgnored(el)) continue;

          const rect = el.getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) continue;

          const overflow = {
            left: Math.max(0, slideBox.left - rect.left),
            top: Math.max(0, slideBox.top - rect.top),
            right: Math.max(0, rect.right - slideBox.right),
            bottom: Math.max(0, rect.bottom - slideBox.bottom),
          };
          const max = Math.max(overflow.left, overflow.top, overflow.right, overflow.bottom);

          if (max > threshold) {
            offenders.push({
              selector: selectorOf(el),
              text: textOf(el),
              overflow: Object.fromEntries(
                Object.entries(overflow).map(([key, value]) => [key, Number(value.toFixed(2))]),
              ),
              max: Number(max.toFixed(2)),
              box: {
                x: Number((rect.left - slideBox.left).toFixed(2)),
                y: Number((rect.top - slideBox.top).toFixed(2)),
                width: Number(rect.width.toFixed(2)),
                height: Number(rect.height.toFixed(2)),
              },
            });
          }
        }

        offenders.sort((a, b) => b.max - a.max);

        return {
          slide: Number(section?.id || index + 1),
          overflow: offenders.length > 0,
          offenderCount: offenders.length,
          offenders: offenders.slice(0, maxOffenders),
        };
      });

      return {
        checkedAt: new Date().toISOString(),
        slideCount: slides.length,
        threshold,
        overflowCount: slides.filter((slide) => slide.overflow).length,
        slides: slides.filter((slide) => slide.overflow),
      };
    }, { threshold, maxOffenders });

    if (asJson) {
      console.log(JSON.stringify(report, null, 2));
    } else if (report.overflowCount === 0) {
      console.log(
        `OK: checked ${report.slideCount} slides in ${path.relative(root, htmlPath)}; no overflow above ${threshold}px.`,
      );
    } else {
      console.log(
        `Overflow found in ${report.overflowCount}/${report.slideCount} slides (${path.relative(root, htmlPath)}):`,
      );
      for (const slide of report.slides) {
        console.log(`\nSlide ${slide.slide}: ${slide.offenderCount} offender(s)`);
        for (const offender of slide.offenders) {
          const sides = Object.entries(offender.overflow)
            .filter(([, value]) => value > threshold)
            .map(([key, value]) => `${key}+${value}px`)
            .join(", ");
          const label = offender.text ? ` "${offender.text}"` : "";
          console.log(`  - ${offender.selector}${label}: ${sides}`);
        }
      }
    }

    process.exitCode = report.overflowCount > 0 ? 2 : 0;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
