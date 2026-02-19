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

function stripHtml(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function toPortableTextBlocks(text) {
  const clean = stripHtml(text);
  if (!clean) return [];

  // Single simple block. (We can improve later if needed.)
  return [
    {
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", text: clean, marks: [] }],
    },
  ];
}

async function main() {
  const products = await client.fetch(
    `*[_type=="product" && (defined(image) || defined(descriptionHtml))]{_id, image, descriptionHtml, mainImage, body}`
  );

  console.log(`Found ${products.length} products with unknown fields to fix`);

  let patched = 0;

  for (const p of products) {
    const setOps = {};
    const unsetOps = [];

    // Move image -> mainImage (only if mainImage not already set)
    if (p.image && !p.mainImage) {
      setOps.mainImage = p.image;
    }

    // Move descriptionHtml -> body (only if body empty/not set)
    const hasBody = Array.isArray(p.body) && p.body.length > 0;
    if (p.descriptionHtml && !hasBody) {
      setOps.body = toPortableTextBlocks(p.descriptionHtml);
    }

    // Remove unknown fields
    if (typeof p.image !== "undefined") unsetOps.push("image");
    if (typeof p.descriptionHtml !== "undefined") unsetOps.push("descriptionHtml");

    // If nothing to do, skip
    if (Object.keys(setOps).length === 0 && unsetOps.length === 0) continue;

    await client
      .patch(p._id)
      .set(setOps)
      .unset(unsetOps)
      .commit({ autoGenerateArrayKeys: true });

    patched += 1;
  }

  console.log(`Done. Patched ${patched} products.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
