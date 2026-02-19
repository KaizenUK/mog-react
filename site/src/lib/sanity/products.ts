// site/src/lib/sanity/products.ts
import { sanityClient } from "./client";

export type ProductListItem = {
  title: string;
  slug: string;
  summary?: string;
};

export type ProductDoc = {
  title: string;
  slug: string;
  summary?: string;

  viscosityGrade?: string;
  approvals?: string[];

  packSizes?: Array<{ label?: string; sku?: string }>;

  productTechnicalDocuments?: Array<{
    title?: string;
    docType?: string;
    language?: string;
    url?: string;
  }>;

  linkedTechnicalDocuments?: Array<{
    title?: string;
    docType?: string;
    language?: string;
    url?: string;
  }>;
};


export async function getAllProducts(): Promise<ProductListItem[]> {
  const query = /* groq */ `
    *[_type == "product" && defined(slug.current)]
    | order(title asc) {
      title,
      "slug": slug.current,
      "summary": summary
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
      _id,
      title,
      "slug": slug.current,
      summary,

      viscosityGrade,
      approvals,

      // Pack sizes are objects in your schema
      packSizes[] {
        label,
        sku
      },

      // Product-linked docs (preferred admin flow)
      "productTechnicalDocuments": technicalDocuments[]->{
        title,
        docType,
        language,
        "url": file.asset->url
      },

      // Reverse-linked docs (doc -> relatedProducts)
      "linkedTechnicalDocuments": *[
        _type == "technicalDocument"
        && references(^._id)
        && defined(file.asset)
      ] | order(docType asc, title asc) {
        title,
        docType,
        language,
        "url": file.asset->url
      }
    }
  `;

  const result = await sanityClient.fetch(query, { slug });
  return result || null;
}
