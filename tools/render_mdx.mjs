import fs from "node:fs";
import path from "node:path";
import * as runtime from "react/jsx-runtime";
import { compile, run } from "@mdx-js/mdx";
import { renderToStaticMarkup } from "react-dom/server";
import { slideComponents } from "../components/slide-components.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function stripReactPreloads(html) {
  return html.replace(/<link rel="preload" as="image" href="[^"]*"\/>/g, "");
}

function renderMarpDirectives(source) {
  return source.replace(/\{\/\*\s*(_[A-Za-z][\w-]*:\s*[\s\S]*?)\s*\*\/\}/g, "<!-- $1 -->");
}

async function renderMdxSnippet(source) {
  const compiled = await compile(source, {
    outputFormat: "function-body",
    jsx: false,
  });
  const { default: MDXContent } = await run(String(compiled), {
    ...runtime,
    baseUrl: import.meta.url,
  });

  return stripReactPreloads(renderToStaticMarkup(runtime.jsx(MDXContent, { components: slideComponents })));
}

async function renderMdxComponents(source) {
  const names = Object.keys(slideComponents).join("|");
  const componentTag = new RegExp(`<(${names})\\b[\\s\\S]*?\\/>`, "g");
  let rendered = "";
  let cursor = 0;
  const mdxSource = renderMarpDirectives(source);

  for (const match of mdxSource.matchAll(componentTag)) {
    rendered += mdxSource.slice(cursor, match.index);
    rendered += await renderMdxSnippet(match[0]);
    cursor = match.index + match[0].length;
  }

  return rendered + mdxSource.slice(cursor);
}

function deckNameOf(deck) {
  return deck.replace(/\.(mdx|md)$/, "");
}

function findDeckInput(course, deck) {
  const deckName = deckNameOf(deck);
  const slidesDir = path.join(root, "courses", course, "md_slides");
  const mdxInput = path.join(slidesDir, `${deckName}.mdx`);
  const mdInput = path.join(slidesDir, `${deckName}.md`);
  return fs.existsSync(mdxInput) ? mdxInput : mdInput;
}

function deckPaths(course, deck) {
  const deckName = deckNameOf(deck);
  const input = findDeckInput(course, deckName);
  const output = path.join(root, ".marp-cache", course, "md_slides", `${deckName}.md`);
  return { input, output };
}

function syncCourseAssets(course) {
  const sourceAssets = path.join(root, "courses", course, "assets");
  const cacheAssets = path.join(root, ".marp-cache", course, "assets");

  if (!fs.existsSync(sourceAssets)) {
    return;
  }

  fs.rmSync(cacheAssets, { recursive: true, force: true });
  fs.cpSync(sourceAssets, cacheAssets, { recursive: true });
}

async function renderFile(input, output) {
  if (!fs.existsSync(input)) {
    throw new Error(`Missing input: ${path.relative(root, input)}`);
  }

  const rendered = await renderMdxComponents(fs.readFileSync(input, "utf8"));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, rendered, "utf8");
  console.log(`${path.relative(root, input)} -> ${path.relative(root, output)}`);
}

async function main() {
  const input = readArg("--input");
  const output = readArg("--output");
  const course = readArg("--course") || process.env.COURSE || "giao_duc_phap_luat";
  const deck = readArg("--deck") || process.env.DECK || "bai_01";

  syncCourseAssets(course);

  if (input || output) {
    if (!input || !output) {
      throw new Error("Use --input and --output together.");
    }
    await renderFile(path.resolve(root, input), path.resolve(root, output));
    return;
  }

  if (process.argv.includes("--all")) {
    const slidesDir = path.join(root, "courses", course, "md_slides");
    const decks = fs
      .readdirSync(slidesDir)
      .filter((name) => name.endsWith(".mdx") || name.endsWith(".md"));

    for (const file of decks) {
      const paths = deckPaths(course, file);
      await renderFile(paths.input, paths.output);
    }
    return;
  }

  const paths = deckPaths(course, deck);
  await renderFile(paths.input, paths.output);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
