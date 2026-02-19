/* eslint-disable no-console */
/* global process, console */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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

function sha1(input) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function normaliseSlug(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function fileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    return base || "document.pdf";
  } catch {
    return "document.pdf";
  }
}

function isPdfUrl(url) {
  return /\.pdf(\?|#|$)/i.test(String(url || ""));
}

async function fetchBinary(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/pdf";
  return { buf, contentType };
}

async function uploadPdf(url) {
  const { buf, contentType } = await fetchBinary(url);
  const filename = fileNameFromUrl(url);

  const asset = await client.assets.upload("file", buf, {
    filename,
    contentType,
  });

  return { _type: "reference", _ref: asset._id };
}

function makeTechDocId(productSlug, url) {
  return `techdoc-${productSlug}-${sha1(url).slice(0, 12)}`;
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

  // Map: WP product post_id -> product slug
  const wpProductIdToSlug = new Map();

  for (const it of items) {
    if (it?.["wp:post_type"] === "product") {
      const wpId = String(it?.["wp:post_id"] || "").trim();
      const slugRaw = String(it?.["wp:post_name"] || "").trim();
      const title = String(it?.title || "").trim();
      const slug = normaliseSlug(slugRaw || title);
      if (wpId && slug) wpProductIdToSlug.set(wpId, slug);
    }
  }

  console.log(`Mapped ${wpProductIdToSlug.size} WP products (post_id -> slug)`);

  // Fetch Sanity product IDs by slug (we used product-${slug} ids in the importer)
  const sanityProducts = await client.fetch(`*[_type=="product"]{_id, "slug": slug.current}`);
  const sanitySlugToId = new Map();
  for (const p of sanityProducts) {
    if (p?.slug && p?._id) sanitySlugToId.set(String(p.slug), String(p._id));
  }

  console.log(`Found ${sanitySlugToId.size} Sanity products (slug -> _id)`);

  // Now process attachments that are PDFs and have a post_parent pointing to a product
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const it of items) {
    if (it?.["wp:post_type"] !== "attachment") continue;

    const mime = String(it?.["wp:post_mime_type"] || "").toLowerCase();
    const wpParent = String(it?.["wp:post_parent"] || "").trim();

    // Attachment URL: prefer wp:attachment_url, fallback to guid
    const attachmentUrl = String(it?.["wp:attachment_url"] || "").trim();
    const guid = String(it?.guid?.["#text"] ?? it?.guid ?? "").trim();
    const url = attachmentUrl || guid;

    if (!wpParent) continue;
    if (!wpProductIdToSlug.has(wpParent)) continue;

    // Identify PDFs
    const looksPdf = isPdfUrl(url) || mime.includes("pdf");
    if (!looksPdf) continue;

    const productSlug = wpProductIdToSlug.get(wpParent);
    const sanityProductId = sanitySlugToId.get(productSlug);

    if (!sanityProductId) {
      skipped += 1;
      continue;
    }

    const techDocId = makeTechDocId(productSlug, url);

    // Skip if tech doc already exists
    const existing = await client.fetch(`*[_id==$id][0]{_id}`, { id: techDocId });
    if (existing?._id) {
      skipped += 1;
      continue;
    }

    try {
      const fileRef = await uploadPdf(url);
      const filename = fileNameFromUrl(url);

      const doc = {
        _id: techDocId,
        _type: "technicalDocument",
        title: filename.replace(/\.pdf$/i, ""),
        file: { _type: "file", asset: fileRef },
        relatedProducts: [{ _type: "reference", _ref: sanityProductId }],
      };

      await client.createOrReplace(doc);
      created += 1;
      console.log(`✔ Tech doc: ${productSlug} -> ${filename}`);
    } catch (e) {
      failed += 1;
      console.warn(`✖ Failed tech doc for ${productSlug}: ${e.message}`);
    }
  }

  console.log(`Done. Created ${created}. Skipped ${skipped}. Failed ${failed}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
