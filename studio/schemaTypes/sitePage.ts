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
        defineField({ name: "headline", title: "Headline", type: "string" }),
        defineField({ name: "intro", title: "Intro text", type: "text", rows: 3 }),
        defineField({
          name: "cta",
          title: "Primary CTA",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "href", title: "Link", type: "string", description: "e.g. /contact-us" }),
          ],
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