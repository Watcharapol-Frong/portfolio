// One-time migration: reads the old src/content/articles/*/index.mdx files
// and creates matching documents in Sanity.
//
// Usage:
//   SANITY_WRITE_TOKEN=... node --env-file=.env scripts/migrate-to-sanity.mjs
//
// Requires a Sanity API token with write access (Project -> API -> Tokens
// in sanity.io/manage). Never commit or paste that token anywhere - pass it
// as an env var on the command line only.

import { createClient } from "@sanity/client";
import { parse as parseYaml } from "yaml";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId) throw new Error("Missing PUBLIC_SANITY_PROJECT_ID");
if (!token) throw new Error("Missing SANITY_WRITE_TOKEN");

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const key = () => crypto.randomBytes(6).toString("hex");

async function uploadImageFromFile(filePath) {
  const buffer = await readFile(filePath);
  const asset = await client.assets.upload("image", buffer, {
    filename: path.basename(filePath),
  });
  return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
}

async function uploadImageFromUrl(url) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buffer, {
    filename: path.basename(new URL(url).pathname) || "image.jpg",
  });
  return {
    _type: "image",
    _key: key(),
    asset: { _type: "reference", _ref: asset._id },
  };
}

function textSpans(text) {
  return text
    .split(/(`[^`]+`)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("`") && part.endsWith("`")
        ? { _type: "span", _key: key(), text: part.slice(1, -1), marks: ["code"] }
        : { _type: "span", _key: key(), text: part, marks: [] }
    );
}

function headingBlock(style, text) {
  return { _type: "block", _key: key(), style, markDefs: [], children: textSpans(text) };
}

function paragraphBlock(text) {
  return { _type: "block", _key: key(), style: "normal", markDefs: [], children: textSpans(text) };
}

async function parseBody(bodyMarkdown) {
  const paragraphs = bodyMarkdown.trim().split(/\n\s*\n/);
  const blocks = [];

  for (const raw of paragraphs) {
    const text = raw.trim();
    if (!text) continue;

    if (text.startsWith("## ")) {
      blocks.push(headingBlock("h2", text.slice(3).trim()));
      continue;
    }
    if (text.startsWith("### ")) {
      blocks.push(headingBlock("h3", text.slice(4).trim()));
      continue;
    }
    const imageMatch = text.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      const [, alt, url] = imageMatch;
      const image = await uploadImageFromUrl(url);
      image.alt = alt;
      blocks.push(image);
      continue;
    }
    blocks.push(paragraphBlock(text));
  }

  return blocks;
}

async function migrateArticle(dirName) {
  const dir = path.join("src/content/articles", dirName);
  const raw = await readFile(path.join(dir, "index.mdx"), "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Could not parse frontmatter in ${dirName}`);

  const [, frontmatterRaw, bodyMarkdown] = match;
  const frontmatter = parseYaml(frontmatterRaw);

  console.log(`Migrating ${dirName}...`);

  const coverPath = path.join(dir, frontmatter.cover.replace("./", ""));
  const cover = await uploadImageFromFile(coverPath);
  const body = await parseBody(bodyMarkdown);

  const doc = {
    _id: `article-${dirName}`,
    _type: "article",
    title: frontmatter.title,
    slug: { _type: "slug", current: dirName },
    description: frontmatter.description,
    cover,
    tags: frontmatter.tags ?? [],
    date: new Date(frontmatter.date).toISOString(),
    sources: (frontmatter.sources ?? []).map((s) => ({ ...s, _key: key(), _type: "source" })),
    cta: frontmatter.cta,
    draft: frontmatter.draft ?? false,
    body,
  };

  await client.createOrReplace(doc);
  console.log(`  -> done (${doc._id})`);
}

const entries = await readdir("src/content/articles", { withFileTypes: true });
const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

for (const dir of dirs) {
  await migrateArticle(dir);
}

console.log(`Migrated ${dirs.length} article(s).`);
