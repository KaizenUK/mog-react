// site/src/lib/sanity/technicalLibrary.ts
import { sanityClient } from "./client";

export type TechDocListItem = {
  title: string;
  docType?: string;
  url?: string;
  productSlug?: string;
};

export async function getTechnicalLibraryItems(): Promise<TechDocListItem[]> {
  const query = /* groq */ `
    *[_type == "technicalDoc" && defined(file.asset)]
    | order(title asc) {
      title,
      docType,
      "url": file.asset->url,
      "productSlug": product->slug.current
    }
  `;

  return await sanityClient.fetch(query);
}
