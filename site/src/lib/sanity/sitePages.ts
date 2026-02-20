// site/src/lib/sanity/sitePages.ts
import { sanityClient } from "./client";
import type { SanityClient } from "@sanity/client";
import { urlForImage } from "./image";

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

export type HeroCta = {
  label?: string;
  href?: string;
  variant?: "primary" | "secondary";
};

export type SitePageHero = {
  // Legacy simple hero
  headline?: string;
  intro?: string;
  cta?: { label?: string; href?: string };

  // Rich home hero
  eyebrow?: string;
  headlineLines?: string[];
  introText?: string;
  bodyText?: string;
  ctas?: HeroCta[];
  videoUrl?: string;
  videoPosterUrl?: string; // resolved from Sanity image
  badges?: string[];
};

export type SitePageDoc = {
  title: string;
  slug: string;
  hero?: SitePageHero;
  sections?: SitePageSection[];
  seo?: unknown;
};

export async function getSitePageBySlug(
  slug: string,
  client: SanityClient = sanityClient,
): Promise<SitePageDoc | null> {
  const query = /* groq */ `
    *[_type == "sitePage" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      hero{
        headline,
        intro,
        cta{ label, href },
        eyebrow,
        headlineLines,
        introText,
        bodyText,
        ctas[]{ label, href, variant },
        videoUrl,
        "videoPosterRaw": videoPoster,
        badges
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

  const result = await client.fetch(query, { slug });
  if (!result) return null;

  // Resolve Sanity image to URL
  if (result.hero?.videoPosterRaw) {
    result.hero.videoPosterUrl = urlForImage(result.hero.videoPosterRaw)
      .width(1280)
      .quality(85)
      .url();
    delete result.hero.videoPosterRaw;
  }

  return result;
}
