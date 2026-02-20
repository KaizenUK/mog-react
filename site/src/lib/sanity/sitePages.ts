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

export type AuthorityIntroData = {
  eyebrow?: string;
  heading?: string;
  paragraphOne?: string;
  paragraphTwo?: string;
};

export type CapabilityTile = {
  title?: string;
  description?: string;
};

export type CapabilitiesData = {
  lead?: string;
  tiles?: CapabilityTile[];
  callout?: string;
};

export type StatItem = {
  figure?: string;
  countTo?: number;
  label?: string;
  sentence?: string;
};

export type StatsSectionData = {
  items?: StatItem[];
};

export type WhyChooseItem = {
  label?: string;
  detail?: string;
};

export type WhyChooseData = {
  heading?: string;
  intro?: string;
  items?: WhyChooseItem[];
  calloutBody?: string;
};

export type FinalCtaData = {
  heading?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  ghostLabel?: string;
  ghostHref?: string;
};

export type LifecyclePillar = {
  ordinal?: string;
  title?: string;
  body?: string;
};

export type LifecycleSectionData = {
  sectionLabel?: string;
  pillars?: LifecyclePillar[];
};

export type SitePageDoc = {
  title: string;
  slug: string;
  hero?: SitePageHero;
  sections?: SitePageSection[];
  authorityIntro?: AuthorityIntroData;
  capabilitiesSection?: CapabilitiesData;
  statsSection?: StatsSectionData;
  whyChooseSection?: WhyChooseData;
  finalCtaSection?: FinalCtaData;
  lifecycleSection?: LifecycleSectionData;
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
      authorityIntro{
        eyebrow,
        heading,
        paragraphOne,
        paragraphTwo
      },
      capabilitiesSection{
        lead,
        tiles[]{ title, description },
        callout
      },
      statsSection{
        items[]{ figure, countTo, label, sentence }
      },
      whyChooseSection{
        heading,
        intro,
        items[]{ label, detail },
        calloutBody
      },
      finalCtaSection{
        heading,
        primaryLabel,
        primaryHref,
        secondaryLabel,
        secondaryHref,
        ghostLabel,
        ghostHref
      },
      lifecycleSection{
        sectionLabel,
        pillars[]{ ordinal, title, body }
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
