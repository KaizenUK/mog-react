import groq from "groq";
import { sanityClient } from "./client";

export type NavSector = { title: string; slug: string; summary?: string };
export type NavProduct = { title: string; slug: string; summary?: string; navDescription?: string };

export type NavigationData = {
  sectors: NavSector[];
  products: NavProduct[];
};

export async function getNavigationData(): Promise<NavigationData> {
  const query = groq`{
    "sectors": *[_type == "sector" && defined(slug.current)]
      | order(title asc) {
        title,
        "slug": slug.current,
        summary
      },
    "products": *[_type == "product" && defined(slug.current) && showInNav == true]
      | order(title asc) {
        title,
        "slug": slug.current,
        summary,
        navDescription
      }
  }`;

  const result = await sanityClient.fetch(query);

  return {
    sectors: result?.sectors ?? [],
    products: result?.products ?? [],
  };
}
