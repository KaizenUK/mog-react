/* eslint-disable no-console */
/* global process, console */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CONFIG (via env vars)
 * Required:
 *  - SANITY_PROJECT_ID
 *  - SANITY_DATASET
 *  - SANITY_API_VERSION
 *  - SANITY_AUTH_TOKEN
 *  - WP_XML_PATH
 *
 * Optional:
 *  - DRY_RUN=true
 */
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET;
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || "2025-02-01";
const SANITY_AUTH_TOKEN = process.env.SANITY_AUTH_TOKEN;
const WP_XML_PATH = process.env.WP_XML_PATH;
const DRY_RUN = String(process.env.DRY_RUN || "").toLowerCase() === "true";

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

function pickFirst(arr) {
  if (Array.isArray(arr)) return arr[0];
  return arr;
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractUrlsFromHtml(html) {
  const urls = new Set();
  const s = String(html || "");
  // href="..."
  for (const m of s.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) urls.add(m[1]);
  // src="..."
  for (const m of s.matchAll(/src\s*=\s*["']([^"']+)["']/gi)) urls.add(m[1]);
  return [...urls];
}

function isLikelyPdf(url) {
  return /\.pdf(\?|#|$)/i.test(String(url || ""));
}

async function fetchBinary(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "";
  return { buf, contentType };
}

function fileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    return base || "file";
  } catch {
    return "file";
  }
}

async function uploadAsset(kind, url) {
  // kind: "image" | "file"
  const { buf, contentType } = await fetchBinary(url);
  const filename = fileNameFromUrl(url);

  if (DRY_RUN) {
    console.log(`[DRY_RUN] would upload ${kind}: ${url}`);
    return { _type: "sanity.asset", _ref: `dryrun-${sha1(url)}` };
  }

  const asset = await client.assets.upload(kind, buf, {
    filename,
    contentType: contentType || undefined,
  });

  return { _type: "reference", _ref: asset._id };
}

function makeProductId(slug) {
  return `product-${slug}`;
}

function makeTechDocId(productSlug, filenameOrHash) {
  return `techdoc-${productSlug}-${filenameOrHash}`;
}

async function upsertDoc(doc) {
  if (DRY_RUN) {
    console.log(`[DRY_RUN] would create/replace doc: ${doc._id} (${doc._type})`);
    return;
  }
  await client.createOrReplace(doc);
}

async function main() {
  const xml = fs.readFileSync(WP_XML_PATH, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Preserve tag names with colons (wp:*, content:*)
    removeNSPrefix: false,
  });
  const data = parser.parse(xml);

  const channel = data?.rss?.channel;
  if (!channel) throw new Error("Invalid WXR: missing rss.channel");

  const items = asArray(channel.item);
  console.log(`Found ${items.length} items in XML`);

  // Build attachment map (ID -> attachment_url)
  const attachmentsById = new Map();
  const attachmentsByGuid = new Map();

  for (const item of items) {
    const postType = item?.["wp:post_type"];
    if (postType === "attachment") {
      const id = String(item?.["wp:post_id"] || "");
      const attachmentUrl = String(item?.["wp:attachment_url"] || "").trim();
      const guid = String(item?.guid?.["#text"] ?? item?.guid ?? "").trim();
      if (id && attachmentUrl) attachmentsById.set(id, attachmentUrl);
      if (guid && attachmentUrl) attachmentsByGuid.set(guid, attachmentUrl);
    }
  }

  console.log(`Found ${attachmentsById.size} attachments with URLs`);

  // NOTE: WooCommerce products in WXR often show as post_type "product"
  const productItems = items.filter((it) => it?.["wp:post_type"] === "product");
  console.log(`Found ${productItems.length} WooCommerce products`);

  // If this export doesn't include products as post_type "product", stop early:
  if (productItems.length === 0) {
    console.log("No items with wp:post_type=product were found in this XML export.");
    console.log("If your export didn't include WooCommerce products, export Products specifically in WP Tools > Export.");
    return;
  }

  let ok = 0;
  let failed = 0;

  for (const item of productItems) {
    try {
      const title = String(item?.title || "").trim();
      const slugRaw = String(item?.["wp:post_name"] || "").trim();
      const slug = normaliseSlug(slugRaw || title);

      if (!slug) throw new Error("Missing slug");

      const contentHtml = String(item?.["content:encoded"] || "");
      const excerptHtml = String(item?.["excerpt:encoded"] || "");

      // Candidate URLs from content (images, PDFs, etc.)
      const urls = extractUrlsFromHtml(contentHtml).concat(extractUrlsFromHtml(excerptHtml));
      const pdfUrls = [...new Set(urls.filter(isLikelyPdf))];

      // Attempt to find featured image via wp:postmeta with _thumbnail_id
      const postmeta = asArray(item?.["wp:postmeta"]);
      const thumbMeta = postmeta.find((m) => String(m?.["wp:meta_key"]) === "_thumbnail_id");
      const thumbId = thumbMeta ? String(thumbMeta?.["wp:meta_value"] || "").trim() : "";
      const featuredImageUrl = thumbId ? attachmentsById.get(thumbId) : null;

      // Upload featured image (if present)
      let mainImage = null;
      if (featuredImageUrl) {
        try {
          const ref = await uploadAsset("image", featuredImageUrl);
          mainImage = { _type: "image", asset: ref };
        } catch (e) {
          console.warn(`Failed to upload featured image for ${slug}: ${e.message}`);
        }
      }

      // Create/replace product doc
      const productId = makeProductId(slug);

      const productDoc = {
        _id: productId,
        _type: "product",
        title: title || slug,
        slug: { _type: "slug", current: slug },
        // These fields must exist in your schema to be stored.
        // If your product schema uses different field names, tell me and I'll adjust.
        summary: stripHtml(excerptHtml).slice(0, 300) || undefined,
        descriptionHtml: contentHtml || undefined,
        image: mainImage || undefined,
      };

      await upsertDoc(productDoc);

      // Create Technical Document records for each PDF URL found in content
      for (const pdfUrl of pdfUrls) {
        try {
          const filename = fileNameFromUrl(pdfUrl);
          const suffix = normaliseSlug(filename.replace(/\.pdf$/i, "")) || sha1(pdfUrl).slice(0, 10);
          const techDocId = makeTechDocId(slug, suffix);

          const fileRef = await uploadAsset("file", pdfUrl);

          const techDoc = {
            _id: techDocId,
            _type: "technicalDocument",
            title: filename.replace(/\.pdf$/i, ""),
            file: { _type: "file", asset: fileRef },
            relatedProducts: [{ _type: "reference", _ref: productId }],
          };

          await upsertDoc(techDoc);
        } catch (e) {
          console.warn(`Failed PDF import for product ${slug}: ${e.message}`);
        }
      }

      ok += 1;
      console.log(`✔ Imported product: ${slug}`);
    } catch (e) {
      failed += 1;
      console.error(`✖ Failed product import: ${e.message}`);
    }
  }

  console.log(`Done. Imported ${ok} products. Failed: ${failed}. DRY_RUN=${DRY_RUN}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
