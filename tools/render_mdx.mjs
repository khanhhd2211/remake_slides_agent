import fs from "node:fs";
import path from "node:path";
import * as runtime from "react/jsx-runtime";
import { compile, run } from "@mdx-js/mdx";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function stripReactPreloads(html) {
  return html.replace(/<link rel="preload" as="image" href="[^"]*"\/>/g, "");
}

function unwrapFormatterParagraphs(html) {
  return html
    .replace(/<(span|h[1-6])([^>]*)><p>([\s\S]*?)<\/p><\/\1>/g, "<$1$2>$3</$1>")
    .replace(/<div([^>]*)><p>([\s\S]*?)<\/p><\/div>/g, (match, attrs, body) => {
      if (!/\bclass="[^"]*(?:text-|font-|leading-|uppercase|lowercase)/.test(attrs)) {
        return match;
      }
      return `<div${attrs}>${body}</div>`;
    });
}

function toPascalCase(name) {
  return name
    .replace(/\.(mdx|md)$/, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

async function compileMdxComponent(source, components = {}) {
  const compiled = await compile(source, {
    outputFormat: "function-body",
    jsx: false,
  });
  const { default: MDXContent } = await run(String(compiled), {
    ...runtime,
    baseUrl: import.meta.url,
  });

  return (props = {}) => runtime.jsx(MDXContent, { ...props, components });
}

async function loadSlideComponents() {
  const componentDir = path.join(root, "components");
  const files = fs
    .readdirSync(componentDir)
    .filter((name) => name.endsWith(".mdx"))
    .sort();
  const components = {};

  for (const file of files) {
    const name = toPascalCase(file);
    const source = fs.readFileSync(path.join(componentDir, file), "utf8");
    components[name] = await compileMdxComponent(source, components);
  }

  return components;
}

function extractMarpDirectives(source) {
  const directives = [];
  const body = source.replace(/^\s*\{\/\*\s*(_[A-Za-z][\w-]*:\s*[\s\S]*?)\s*\*\/\}\s*$/gm, (_match, directive) => {
    directives.push(`<!-- ${directive} -->`);
    return "";
  });

  return { directives, body };
}

function splitFrontmatter(source) {
  if (!source.startsWith("---\n")) {
    return { frontmatter: "", body: source };
  }

  const end = source.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: "", body: source };
  }

  const frontmatter = source.slice(0, end + 4);
  const body = source.slice(end + 4).replace(/^\n/, "");
  return { frontmatter, body };
}

async function renderMdxComponents(source, components) {
  const { frontmatter, body } = splitFrontmatter(source);
  const slides = body.split(/\n---\n/g);
  const renderedSlides = [];

  for (const slide of slides) {
    const { directives, body: slideBody } = extractMarpDirectives(slide);
    const Component = await compileMdxComponent(slideBody, components);
    const rendered = unwrapFormatterParagraphs(
      stripReactPreloads(renderToStaticMarkup(runtime.jsx(Component, {}))),
    );
    renderedSlides.push([...directives, rendered].filter(Boolean).join("\n\n"));
  }

  return `${frontmatter}\n\n${renderedSlides.join("\n\n---\n\n")}`;
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

async function renderFile(input, output, components) {
  if (!fs.existsSync(input)) {
    throw new Error(`Missing input: ${path.relative(root, input)}`);
  }

  const rendered = await renderMdxComponents(fs.readFileSync(input, "utf8"), components);
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

  async function renderAll() {
    syncCourseAssets(course);
    const components = await loadSlideComponents();
    const slidesDir = path.join(root, "courses", course, "md_slides");
    const decks = fs
      .readdirSync(slidesDir)
      .filter((name) => name.endsWith(".mdx") || name.endsWith(".md"));

    for (const file of decks) {
      const paths = deckPaths(course, file);
      await renderFile(paths.input, paths.output, components);
    }
  }

  if (input || output) {
    if (!input || !output) {
      throw new Error("Use --input and --output together.");
    }
    const components = await loadSlideComponents();
    await renderFile(path.resolve(root, input), path.resolve(root, output), components);
    return;
  }

  if (process.argv.includes("--all")) {
    await renderAll();

    if (process.argv.includes("--watch")) {
      const watchDirs = [
        path.join(root, "courses", course, "md_slides"),
        path.join(root, "courses", course, "assets"),
        path.join(root, "components"),
      ].filter((dir) => fs.existsSync(dir));

      let timeout;
      const scheduleRender = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          renderAll().catch((error) => {
            console.error(error instanceof Error ? error.message : error);
          });
        }, 150);
      };

      for (const dir of watchDirs) {
        fs.watch(dir, { recursive: true }, scheduleRender);
      }

      console.log(`Watching MDX/components for course: ${course}`);
      process.stdin.resume();
    }
    return;
  }

  const paths = deckPaths(course, deck);
  const components = await loadSlideComponents();
  await renderFile(paths.input, paths.output, components);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
