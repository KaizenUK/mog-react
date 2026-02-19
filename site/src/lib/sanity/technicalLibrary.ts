// site/src/lib/sanity/technicalLibrary.ts
import { sanityClient } from "./client";

export type TechDocListItem = {
  title: string;
  docType: "tds" | "sds" | "other";
  language?: string;
  url: string;
  tags?: string[];
  relatedProductSlugs?: string[];
};

export async function getTechnicalLibraryItems(): Promise<TechDocListItem[]> {
  const query = /* groq */ `
    *[_type == "technicalDocument" && defined(file.asset)]
    | order(title asc) {
      title,
      docType,
      language,
      tags,
      "url": file.asset->url,
      "relatedProductSlugs": relatedProducts[]->slug.current
    }
  `;

  return await sanityClient.fetch(query);
}
