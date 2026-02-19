// site/src/lib/sanity/products.ts
import { sanityClient } from "./client";

export type ProductListItem = {
  title: string;
  slug: string;
  shortDescription?: string;
};

export type ProductDoc = {
  title: string;
  slug: string;
  shortDescription?: string;
  keySpecs?: Array<{ label: string; value: string }>;
  packSizes?: string[];
  documents?: Array<{ title: string; docType?: string; url?: string }>;
};

export async function getAllProducts(): Promise<ProductListItem[]> {
  const query = /* groq */ `
    *[_type == "product" && defined(slug.current)]
    | order(title asc) {
      title,
      "slug": slug.current,
      shortDescription
    }
  `;

  return await sanityClient.fetch(query);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const query = /* groq */ `
    *[_type == "product" && defined(slug.current)].slug.current
  `;

  return await sanityClient.fetch(query);
}

export async function getProductBySlug(slug: string): Promise<ProductDoc | null> {
  const query = /* groq */ `
    *[_type == "product" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      shortDescription,

      // If your schema uses different field names, tweak these to match:
      keySpecs[] {
        label,
        value
      },

      packSizes[],

      documents[] {
        title,
        docType,
        "url": file.asset->url
      }
    }
  `;

  const result = await sanityClient.fetch(query, { slug });
  return result || null;
}
