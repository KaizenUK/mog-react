/* eslint-disable no-console */
/* global process, console */

import { createClient } from "@sanity/client";

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET;
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || "2025-02-01";
const SANITY_AUTH_TOKEN = process.env.SANITY_AUTH_TOKEN;

if (!SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_AUTH_TOKEN) {
  console.error("Missing required env vars: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_AUTH_TOKEN,
  useCdn: false,
});

function truncate(s, n) {
  const str = String(s || "").replace(/\s+/g, " ").trim();
  if (!str) return "";
  return str.length > n ? str.slice(0, n - 1).trimEnd() + "…" : str;
}

function firstBodyText(body) {
  if (!Array.isArray(body)) return "";
  for (const block of body) {
    if (block?._type !== "block") continue;
    const children = Array.isArray(block.children) ? block.children : [];
    const t = children.map((c) => c?.text || "").join("").trim();
    if (t) return t;
  }
  return "";
}

async function main() {
  // Only patch where missing title/description (don’t overwrite the 16 Yoast-patched ones)
  const products = await client.fetch(`
    *[_type=="product" && (!defined(seo.title) || !defined(seo.description))]{
      _id,
      title,
      summary,
      body,
      seo
    }
  `);

  console.log(`Found ${products.length} products missing seo.title and/or seo.description`);

  let patched = 0;

  for (const p of products) {
    const currentTitle = p?.seo?.title;
    const currentDesc = p?.seo?.description;

    const title = currentTitle || `${p.title} | Midland Oil Group`;

    // Prefer summary; fallback to first body text; final fallback to generic.
    const descSource = currentDesc || p.summary || firstBodyText(p.body) || "";
    const description = currentDesc || truncate(descSource, 160) || `View specifications and technical documents for ${p.title}.`;

    await client
      .patch(p._id)
      .setIfMissing({ seo: { _type: "seo", noIndex: false } })
      .set({
        "seo.title": title,
        "seo.description": description,
      })
      .commit();

    patched += 1;
  }

  console.log(`Done. Patched ${patched} products with default SEO.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
