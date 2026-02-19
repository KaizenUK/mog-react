// site/src/lib/sanity/sectors.ts
import { sanityClient } from "./client";

export type SectorListItem = {
  title: string;
  slug: string;
  summary?: string;
};

export type SectorDoc = {
  title: string;
  slug: string;
  summary?: string;
  body?: unknown[];
  seo?: unknown;
};

export async function getAllSectors(): Promise<SectorListItem[]> {
  const query = /* groq */ `
    *[_type == "sector" && defined(slug.current)]
    | order(title asc) {
      title,
      "slug": slug.current,
      summary
    }
  `;
  return await sanityClient.fetch(query);
}

export async function getAllSectorSlugs(): Promise<string[]> {
  const query = /* groq */ `
    *[_type == "sector" && defined(slug.current)].slug.current
  `;
  return await sanityClient.fetch(query);
}

export async function getSectorBySlug(slug: string): Promise<SectorDoc | null> {
  const query = /* groq */ `
    *[_type == "sector" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      summary,
      body,
      seo
    }
  `;
  const result = await sanityClient.fetch(query, { slug });
  return result || null;
}
