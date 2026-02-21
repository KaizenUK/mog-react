/* eslint-disable no-console */
/* global process, console */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createClient } from "@sanity/client";

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET;
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || "2025-02-01";
const SANITY_AUTH_TOKEN = process.env.SANITY_AUTH_TOKEN;
const CSV_PATH = process.env.CSV_PATH || path.join(os.homedir(), "Downloads", "mog_products_extracted.csv");
const DRY_RUN = String(process.env.DRY_RUN || "").toLowerCase() === "true";

if (!fs.existsSync(CSV_PATH)) {
  console.error(`CSV not found: ${CSV_PATH}`);
  process.exit(1);
}

async function getClient() {
  if (SANITY_PROJECT_ID && SANITY_DATASET && SANITY_AUTH_TOKEN) {
    return createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      token: SANITY_AUTH_TOKEN,
      useCdn: false,
    });
  }

  const { getCliClient } = await import("sanity/cli");
  return getCliClient({
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
  });
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function normaliseSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function normaliseKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sectorCanonical(s) {
  return normaliseKey(s)
    .replace(/\b(oil|oils|lubricant|lubricants|supplier|suppliers|wholesale|the|uk)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAllBrands(s) {
  const k = normaliseKey(s);
  return k === "all brands" || k === "all";
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out.map((v) => String(v || "").trim());
}

function readCsvRows(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function extractViscosityFromTitle(title) {
  const t = String(title || "");
  const mW = t.match(/\b(\d{1,2})\s*[wW]\s*[-/]?\s*(\d{1,3})\b/);
  if (mW) return `${mW[1]}W-${mW[2]}`;

  const mSae = t.match(/\bSAE\s*-?\s*(\d{1,3})\b/i);
  if (mSae) return `SAE ${mSae[1]}`;

  return "";
}

function normaliseViscosity(v) {
  let s = String(v || "").trim();
  if (!s) return "";

  s = s.toUpperCase().replace(/\s+/g, "");

  const mW = s.match(/^(\d{1,2})W[-\/]?(\d{1,3})$/);
  if (mW) return `${mW[1]}W-${mW[2]}`;

  const mSae = s.match(/^SAE[- ]?(\d{1,3})$/);
  if (mSae) return `SAE ${mSae[1]}`;

  return s;
}

function parseSectorLabels(cellValue) {
  const raw = String(cellValue || "").trim();
  if (!raw) return null; // no source value; do not overwrite

  const labels = raw
    .split(/[|/;,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (labels.length === 0) return [];

  const nonAll = labels.filter((s) => !isAllBrands(s));
  if (nonAll.length > 0) return nonAll;

  // only "All Brands" found -> explicitly clear sectors
  return [];
}

function buildSectorLookup(sectors) {
  const byExact = new Map();
  const byCanon = new Map();

  for (const s of sectors) {
    const title = String(s?.title || "");
    const slug = String(s?.slug || "");
    const exactKeys = [title, slug].map(normaliseKey).filter(Boolean);
    const canonKeys = [title, slug].map(sectorCanonical).filter(Boolean);

    for (const k of exactKeys) {
      if (!byExact.has(k)) byExact.set(k, s._id);
    }
    for (const k of canonKeys) {
      if (!byCanon.has(k)) byCanon.set(k, s._id);
    }
  }

  return { byExact, byCanon };
}

function mapSectorLabelsToRefs(labels, sectorLookup) {
  const refs = [];
  const unmatched = [];

  const aliases = new Map([
    ["car engine oil", ["automotive", "car engine oil"]],
    ["engine oil wholesale suppliers", ["engine oil wholesale suppliers", "wholesale"]],
    ["general", ["general"]],
  ]);

  for (const label of labels) {
    const exactKey = normaliseKey(label);
    const canonKey = sectorCanonical(label);

    let ref =
      sectorLookup.byExact.get(exactKey) ||
      sectorLookup.byCanon.get(canonKey) ||
      null;

    if (!ref && aliases.has(exactKey)) {
      const tries = aliases.get(exactKey) || [];
      for (const t of tries) {
        ref =
          sectorLookup.byExact.get(normaliseKey(t)) ||
          sectorLookup.byCanon.get(sectorCanonical(t)) ||
          null;
        if (ref) break;
      }
    }

    if (!ref) {
      // fallback: match when one canonical string contains the other
      for (const [k, v] of sectorLookup.byCanon.entries()) {
        if (!k || !canonKey) continue;
        if (k.includes(canonKey) || canonKey.includes(k)) {
          ref = v;
          break;
        }
      }
    }

    if (ref) refs.push(ref);
    else unmatched.push(label);
  }

  const uniqueRefs = [...new Set(refs)];
  return { refs: uniqueRefs, unmatched };
}

function sameRefArray(a, b) {
  const aa = asArray(a).map((x) => String(x?._ref || x)).filter(Boolean).sort();
  const bb = asArray(b).map((x) => String(x?._ref || x)).filter(Boolean).sort();
  return aa.length === bb.length && aa.every((x, i) => x === bb[i]);
}

function findSectorIdByLabel(label, sectorLookup) {
  const exactKey = normaliseKey(label);
  const canonKey = sectorCanonical(label);
  return (
    sectorLookup.byExact.get(exactKey) ||
    sectorLookup.byCanon.get(canonKey) ||
    null
  );
}

async function ensureGeneralSector(client, sectors) {
  const existing = sectors.find(
    (s) => normaliseKey(s?.title) === "general" || normaliseSlug(s?.slug) === "general"
  );
  if (existing?._id) return existing._id;

  const docId = "sector-general";
  const doc = {
    _id: docId,
    _type: "sector",
    title: "General",
    slug: { _type: "slug", current: "general" },
    summary: "General-purpose lubricants and related products.",
  };

  if (DRY_RUN) {
    console.log(`[DRY_RUN] would create sector: ${docId} (General)`);
    return docId;
  }

  await client.createIfNotExists(doc);
  console.log(`Created sector: ${docId} (General)`);
  return docId;
}

async function main() {
  const client = await getClient();
  const rows = readCsvRows(CSV_PATH);
  console.log(`CSV rows: ${rows.length}`);

  const products = await client.fetch(
    `*[_type=="product"]{_id, title, "slug": slug.current, viscosityGrade, sectors}`
  );
  const sectors = await client.fetch(
    `*[_type=="sector"]{_id, title, "slug": slug.current}`
  );

  const generalSectorId = await ensureGeneralSector(client, sectors);
  const allSectors = [...sectors];
  if (!allSectors.some((s) => s._id === generalSectorId)) {
    allSectors.push({ _id: generalSectorId, title: "General", slug: "general" });
  }

  console.log(`Sanity products: ${products.length}`);
  console.log(`Sanity sectors: ${allSectors.length}`);

  const sectorLookup = buildSectorLookup(allSectors);

  const productBySlug = new Map();
  const productByTitle = new Map();
  for (const p of products) {
    const slugKey = normaliseSlug(p.slug || p.title);
    const titleKey = normaliseKey(p.title);
    if (slugKey && !productBySlug.has(slugKey)) productBySlug.set(slugKey, p);
    if (titleKey && !productByTitle.has(titleKey)) productByTitle.set(titleKey, p);
  }

  let patched = 0;
  let skipped = 0;
  const missingProducts = [];
  const unmatchedSectors = [];

  for (const row of rows) {
    const productName = String(row["Product Name"] || "").trim();
    if (!productName) {
      skipped += 1;
      continue;
    }

    const slugKey = normaliseSlug(productName);
    const titleKey = normaliseKey(productName);
    const product = productBySlug.get(slugKey) || productByTitle.get(titleKey);

    if (!product) {
      missingProducts.push(productName);
      continue;
    }

    const setOps = {};
    let shouldUnsetSectors = false;

    const csvViscosity = normaliseViscosity(row["Viscosity"]);
    const titleViscosity = extractViscosityFromTitle(productName);
    const desiredViscosity = csvViscosity || titleViscosity || "";
    const currentViscosity = normaliseViscosity(product.viscosityGrade);

    if (desiredViscosity && desiredViscosity !== currentViscosity) {
      setOps.viscosityGrade = desiredViscosity;
    }

    const sectorLabels = parseSectorLabels(row["Sector"]);
    if (sectorLabels !== null) {
      const normalizedLabels = sectorLabels.map((label) => {
        const k = normaliseKey(label);
        if (k === "engine oil wholesale suppliers") return "Automotive";
        if (k === "general") return "General";
        return label;
      });

      if (sectorLabels.length === 0) {
        if (asArray(product.sectors).length > 0) shouldUnsetSectors = true;
      } else {
        const mapped = mapSectorLabelsToRefs(normalizedLabels, sectorLookup);
        if (mapped.unmatched.length) {
          unmatchedSectors.push({
            productName,
            labels: mapped.unmatched,
          });
        }

        let refs = mapped.refs;
        if (normalizedLabels.some((s) => normaliseKey(s) === "general")) {
          const generalRef = findSectorIdByLabel("general", sectorLookup);
          if (generalRef) refs = [...new Set([...refs, generalRef])];
        }

        if (refs.length > 0) {
          const desiredRefs = refs.map((_ref) => ({ _type: "reference", _ref }));
          if (!sameRefArray(product.sectors, desiredRefs)) {
            setOps.sectors = desiredRefs;
          }
        }
      }
    }

    const doSet = Object.keys(setOps).length > 0;
    const doUnset = shouldUnsetSectors;
    if (!doSet && !doUnset) {
      skipped += 1;
      continue;
    }

    patched += 1;
    if (DRY_RUN) {
      console.log(`[DRY_RUN] ${product._id}`, { setOps, unset: doUnset ? ["sectors"] : [] });
      continue;
    }

    let patch = client.patch(product._id);
    if (doSet) patch = patch.set(setOps);
    if (doUnset) patch = patch.unset(["sectors"]);
    await patch.commit({ autoGenerateArrayKeys: true });
  }

  console.log(`Patched: ${patched}`);
  console.log(`Skipped/no-op: ${skipped}`);
  console.log(`CSV products not matched in Sanity: ${missingProducts.length}`);
  if (missingProducts.length) {
    console.log(missingProducts.slice(0, 25).join(" | "));
  }

  console.log(`Rows with unmatched sector labels: ${unmatchedSectors.length}`);
  if (unmatchedSectors.length) {
    for (const row of unmatchedSectors.slice(0, 25)) {
      console.log(`${row.productName}: ${row.labels.join(", ")}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
