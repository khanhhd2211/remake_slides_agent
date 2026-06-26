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
  node tools/check_slide_images.js --course giao_duc_chinh_tri --deck bai_03
  node tools/check_slide_images.js --html courses/giao_duc_chinh_tri/md_slides/bai_03.html

Options:
  --render                Run npm run html before checking.
  --min-width <px>        Minimum useful rendered image width. Default: 180.
  --min-height <px>       Minimum useful rendered image height. Default: 140.
  --min-area-pct <pct>    Minimum image area as percent of slide area. Default: 3.
  --max-offenders <n>     Max images printed per slide. Default: 8.
  --browser-path <path>   Browser executable. Defaults to Brave/Chrome/Edge lookup.
  --json                  Print machine-readable JSON.
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

  const minWidth = Number(arg("--min-width", "180"));
  const minHeight = Number(arg("--min-height", "140"));
  const minAreaPct = Number(arg("--min-area-pct", "3"));
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

    const report = await page.evaluate(({ minWidth, minHeight, minAreaPct, maxOffenders }) => {
      const slideNodes = [
        ...document.querySelectorAll("svg[data-marpit-svg], svg.bespoke-marp-slide"),
      ];

      function imageLabel(img) {
        const src = img.getAttribute("src") || "";
        return {
          src,
          file: src.split("/").pop() || src,
          alt: (img.getAttribute("alt") || "").replace(/\s+/g, " ").trim(),
        };
      }

      function shouldIgnore(img) {
        const { file, alt } = imageLabel(img);
        const cls = typeof img.className === "string" ? img.className : "";
        const style = getComputedStyle(img);
        const opacity = Number(style.opacity || "1");

        if (/logo/i.test(file) || /logo|Logo trường/i.test(alt)) return true;
        if (opacity < 0.5) return true;
        if (img.closest("[data-image-size-ignore], [data-overflow-ignore]")) return true;
        if (cls.includes("absolute") && (cls.includes("blur") || cls.includes("opacity-"))) return true;

        return false;
      }

      const slides = slideNodes.map((svg, index) => {
        const section = svg.querySelector("section");
        const rootNode = section || svg;
        const slideBox = rootNode.getBoundingClientRect();
        const slideArea = slideBox.width * slideBox.height;
        const images = [];

        for (const img of [...rootNode.querySelectorAll("img")]) {
          if (shouldIgnore(img)) continue;

          const rect = img.getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) continue;

          const areaPct = (rect.width * rect.height / slideArea) * 100;
          const reasons = [];
          if (rect.width < minWidth) reasons.push(`width ${rect.width.toFixed(1)}px < ${minWidth}px`);
          if (rect.height < minHeight) reasons.push(`height ${rect.height.toFixed(1)}px < ${minHeight}px`);
          if (areaPct < minAreaPct) reasons.push(`area ${areaPct.toFixed(2)}% < ${minAreaPct}%`);

          if (reasons.length) {
            images.push({
              ...imageLabel(img),
              reasons,
              width: Number(rect.width.toFixed(1)),
              height: Number(rect.height.toFixed(1)),
              areaPct: Number(areaPct.toFixed(2)),
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              x: Number((rect.left - slideBox.left).toFixed(1)),
              y: Number((rect.top - slideBox.top).toFixed(1)),
            });
          }
        }

        images.sort((a, b) => a.areaPct - b.areaPct);
        return {
          slide: index + 1,
          images: images.slice(0, maxOffenders),
          totalOffenders: images.length,
        };
      }).filter((slide) => slide.totalOffenders > 0);

      return {
        checkedSlides: slideNodes.length,
        thresholds: { minWidth, minHeight, minAreaPct },
        slides,
      };
    }, { minWidth, minHeight, minAreaPct, maxOffenders });

    if (asJson) {
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.slides.length ? 2 : 0);
    }

    if (!report.slides.length) {
      console.log(
        `OK: checked ${report.checkedSlides} slides in ${path.relative(root, htmlPath)}; no image below thresholds ` +
          `(min-width ${minWidth}px, min-height ${minHeight}px, min-area ${minAreaPct}%).`,
      );
      return;
    }

    console.log(
      `Small images found in ${report.slides.length}/${report.checkedSlides} slides ` +
        `(${path.relative(root, htmlPath)}):\n`,
    );

    const worst = report.slides
      .flatMap((slide) => slide.images.map((img) => ({ slide: slide.slide, ...img })))
      .sort((a, b) => a.areaPct - b.areaPct)
      .slice(0, 10);

    if (worst.length) {
      console.log("Worst offenders:");
      for (const img of worst) {
        const alt = img.alt ? ` "${img.alt}"` : "";
        console.log(
          `  - Slide ${img.slide}: ${img.file}${alt}: ${img.width}x${img.height}px, ` +
            `area ${img.areaPct}% (${img.reasons.join("; ")})`,
        );
      }
      console.log("");
    }

    for (const slide of report.slides) {
      console.log(`Slide ${slide.slide}: ${slide.totalOffenders} small image(s)`);
      for (const img of slide.images) {
        const alt = img.alt ? ` "${img.alt}"` : "";
        console.log(
          `  - ${img.file}${alt}: ${img.width}x${img.height}px, area ${img.areaPct}% ` +
            `(${img.reasons.join("; ")})`,
        );
      }
      if (slide.totalOffenders > slide.images.length) {
        console.log(`  ... ${slide.totalOffenders - slide.images.length} more not shown`);
      }
    }

    process.exit(2);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
