//DON'T CONFUSE THIS WITH STATIC PAGES - THIS SCHEMA CONTROLS DYNAMIC TEXT IN ASTRO STATIC PAGES - USE THESE WHEN CREATING STATIC PAGES TO ENSURE THERE ARE EDITABLE FIELDS (NOT DYNAMIC)//
import { defineField, defineType } from "sanity";

export const sitePage = defineType({
  name: "sitePage",
  title: "Site page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 200 },
      description: "Use paths like: sustainability, company/about-us, services/oil-regeneration",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      fields: [
        // ── Legacy simple hero (used by non-home sitePages) ──
        defineField({ name: "headline", title: "Headline (simple)", type: "string", description: "Used by standard page heroes." }),
        defineField({ name: "intro", title: "Intro text (simple)", type: "text", rows: 3 }),
        defineField({
          name: "cta",
          title: "Primary CTA (simple)",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "href", title: "Link", type: "string", description: "e.g. /contact-us" }),
          ],
        }),

        // ── Rich home hero fields ──
        defineField({
          name: "eyebrow",
          title: "Eyebrow",
          type: "string",
          description: "Small label above the H1 — e.g. 'Lubricant Suppliers & Manufacturers · West Midlands'",
        }),
        defineField({
          name: "headlineLines",
          title: "Headline lines",
          type: "array",
          of: [{ type: "string" }],
          description: "Each string renders as its own line in the H1 — the 'choppy / bam' effect. Keep each line short.",
        }),
        defineField({
          name: "introText",
          title: "Intro paragraph",
          type: "text",
          rows: 4,
          description: "First paragraph beneath the headline.",
        }),
        defineField({
          name: "bodyText",
          title: "Body paragraph",
          type: "text",
          rows: 4,
          description: "Second paragraph — additional context.",
        }),
        defineField({
          name: "ctas",
          title: "CTAs",
          type: "array",
          description: "Buttons below the copy. First is treated as primary.",
          of: [
            {
              type: "object",
              name: "cta",
              fields: [
                defineField({ name: "label", title: "Label", type: "string" }),
                defineField({ name: "href", title: "Link", type: "string" }),
                defineField({
                  name: "variant",
                  title: "Variant",
                  type: "string",
                  options: { list: ["primary", "secondary"], layout: "radio" },
                  initialValue: "primary",
                }),
              ],
              preview: { select: { title: "label", subtitle: "href" } },
            },
          ],
        }),
        defineField({
          name: "videoUrl",
          title: "Video URL",
          type: "url",
          description: "CDN URL for the hero video (e.g. Cloudflare R2, Bunny, Vimeo direct). Leave blank to use the local fallback.",
        }),
        defineField({
          name: "videoPoster",
          title: "Video poster image",
          type: "image",
          description: "Shown before video plays and for reduced-motion users. Upload a high-quality still frame.",
          options: { hotspot: true },
        }),
        defineField({
          name: "badges",
          title: "Trust badges",
          type: "array",
          of: [{ type: "string" }],
          description: "Short labels shown beneath the CTAs — e.g. 'UK Manufacturer', '150+ Years Experience'.",
        }),
      ],
    }),

    defineField({
      name: "sections",
      title: "Page sections",
      type: "array",
      of: [
        {
          type: "object",
          name: "richTextSection",
          title: "Rich text",
          fields: [
            defineField({ name: "title", title: "Section title (optional)", type: "string" }),
            defineField({
              name: "body",
              title: "Content",
              type: "array",
              of: [{ type: "block" }],
            }),
          ],
          preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: title || "Rich text" }) },
        },
        {
          type: "object",
          name: "featureListSection",
          title: "Feature list",
          fields: [
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({
              name: "items",
              title: "Items",
              type: "array",
              of: [{ type: "string" }],
            }),
          ],
          preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: title || "Feature list" }) },
        },
        {
          type: "object",
          name: "ctaSection",
          title: "CTA block",
          fields: [
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "text", title: "Text", type: "text", rows: 3 }),
            defineField({ name: "buttonLabel", title: "Button label", type: "string" }),
            defineField({ name: "buttonHref", title: "Button link", type: "string" }),
          ],
          preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: title || "CTA" }) },
        },
      ],
    }),

    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
  },
});
// PLEASE DO NOT ADD MORE TO THIS SCHEMA WITHOUT CONSULTING THE DEV FIRST//