// site/src/lib/sanity/products.ts
import { sanityClient } from "./client";

export type ProductListItem = {
  title: string;
  slug: string;
  summary?: string;
};

export type ProductDoc = {
  _id?: string;

  title: string;
  slug: string;
  summary?: string;

  mainImage?: any;
  body?: any[];

  seo?: {
    title?: string;
    description?: string;
    noIndex?: boolean;
    canonicalUrl?: string;
  };

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

  mainImage,
  body,

seo{
  title,
  description,
  noIndex,
  canonicalUrl
},

  viscosityGrade,
  approvals,

  packSizes[] {
    label,
    sku
  },

  "productTechnicalDocuments": technicalDocuments[]->{
    title,
    docType,
    language,
    "url": file.asset->url
  },

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
