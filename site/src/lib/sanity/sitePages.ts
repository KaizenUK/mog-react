// site/src/lib/sanity/sitePages.ts
import { sanityClient } from "./client";

export type SitePageSection =
  | {
      _type: "richTextSection";
      title?: string;
      body?: unknown[];
    }
  | {
      _type: "featureListSection";
      title?: string;
      items?: string[];
    }
  | {
      _type: "ctaSection";
      title?: string;
      text?: string;
      buttonLabel?: string;
      buttonHref?: string;
    };

export type SitePageDoc = {
  title: string;
  slug: string;
  hero?: {
    headline?: string;
    intro?: string;
    cta?: { label?: string; href?: string };
  };
  sections?: SitePageSection[];
  seo?: unknown;
};

export async function getSitePageBySlug(slug: string): Promise<SitePageDoc | null> {
  const query = /* groq */ `
    *[_type == "sitePage" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      hero{
        headline,
        intro,
        cta{
          label,
          href
        }
      },
      sections[]{
        _type,
        title,
        body,
        items,
        text,
        buttonLabel,
        buttonHref
      },
      seo
    }
  `;

  const result = await sanityClient.fetch(query, { slug });
  return result || null;
}
