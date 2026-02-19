/* eslint-disable no-console */
/* global process, console */

import fs from "node:fs";
import { createClient } from "@sanity/client";
import { XMLParser } from "fast-xml-parser";

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET;
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || "2025-02-01";
const SANITY_AUTH_TOKEN = process.env.SANITY_AUTH_TOKEN;
const WP_XML_PATH = process.env.WP_XML_PATH;

if (!SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_AUTH_TOKEN || !WP_XML_PATH) {
  console.error("Missing required env vars.");
  console.error("Need: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_AUTH_TOKEN, WP_XML_PATH");
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_AUTH_TOKEN,
  useCdn: false,
});

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function normaliseSlug(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function getMetaMap(postmeta) {
  const map = new Map();
  for (const m of asArray(postmeta)) {
    const k = String(m?.["wp:meta_key"] ?? "").trim();
    const v = String(m?.["wp:meta_value"] ?? "").trim();
    if (k) map.set(k, v);
  }
  return map;
}

function parseNoIndex(metaMap) {
  // Common Yoast patterns seen in exports:
  // _yoast_wpseo_meta-robots-noindex: "1" or "0"
  // Sometimes other keys exist; we’ll interpret loosely but safely.
  const v =
    metaMap.get("_yoast_wpseo_meta-robots-noindex") ??
    metaMap.get("_yoast_wpseo_meta-robots-noindex ") ??
    metaMap.get("_yoast_wpseo_noindex");

  if (!v) return null;

  const s = String(v).toLowerCase().trim();
  if (s === "1" || s === "true" || s === "yes" || s === "noindex") return true;
  if (s === "0" || s === "false" || s === "no") return false;

  return null;
}

function safeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return null;
  try {
    // Accept only absolute URLs
    const url = new URL(s);
    return url.toString();
  } catch {
    return null;
  }
}

async function main() {
  const xml = fs.readFileSync(WP_XML_PATH, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: false,
  });
  const data = parser.parse(xml);
  const channel = data?.rss?.channel;
  if (!channel) throw new Error("Invalid WXR: missing rss.channel");

  const items = asArray(channel.item);
  const productItems = items.filter((it) => it?.["wp:post_type"] === "product");

  console.log(`Found ${productItems.length} products in XML`);

  // Build Sanity lookup: slug -> _id
  const sanityProducts = await client.fetch(`*[_type=="product"]{_id, "slug": slug.current}`);
  const sanitySlugToId = new Map();
  for (const p of sanityProducts) {
    if (p?.slug && p?._id) sanitySlugToId.set(String(p.slug), String(p._id));
  }

  console.log(`Found ${sanitySlugToId.size} products in Sanity (slug -> _id)`);

  let patched = 0;
  let skipped = 0;
  let missing = 0;

  for (const it of productItems) {
    const wpSlugRaw = String(it?.["wp:post_name"] ?? "").trim();
    const title = String(it?.title ?? "").trim();
    const slug = normaliseSlug(wpSlugRaw || title);

    if (!slug) {
      skipped += 1;
      continue;
    }

    const sanityId = sanitySlugToId.get(slug);
    if (!sanityId) {
      missing += 1;
      continue;
    }

    const metaMap = getMetaMap(it?.["wp:postmeta"]);

    const yoastTitle = (metaMap.get("_yoast_wpseo_title") || "").trim();
    const yoastDesc = (metaMap.get("_yoast_wpseo_metadesc") || "").trim();
    const yoastCanonical = safeUrl(metaMap.get("_yoast_wpseo_canonical"));
    const yoastNoIndex = parseNoIndex(metaMap);

    // If nothing to apply, skip
    if (!yoastTitle && !yoastDesc && !yoastCanonical && yoastNoIndex === null) {
      skipped += 1;
      continue;
    }

    const setOps = {};
    // Only set fields when we actually have a value.
    // We also setIfMissing seo object so patching works even if seo not present.
    if (yoastTitle) setOps["seo.title"] = yoastTitle;
    if (yoastDesc) setOps["seo.description"] = yoastDesc;
    if (yoastCanonical) setOps["seo.canonicalUrl"] = yoastCanonical;
    if (yoastNoIndex !== null) setOps["seo.noIndex"] = yoastNoIndex;

    await client
      .patch(sanityId)
      .setIfMissing({ seo: { _type: "seo", noIndex: false } })
      .set(setOps)
      .commit();

    patched += 1;
  }

  console.log(`Done. Patched: ${patched}. Skipped (no Yoast data): ${skipped}. Missing in Sanity: ${missing}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
