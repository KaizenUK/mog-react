import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    {name: 'general', title: 'General'},
    {name: 'seo', title: 'SEO'},
    {name: 'navigation', title: 'Navigation'},
    {name: 'contact', title: 'Contact'},
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      group: 'general',
    }),

    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'seo',
      group: 'seo',
    }),

    defineField({
      name: 'primaryNav',
      title: 'Primary navigation',
      description:
        'Controls the top navigation order. Keep IA stable (Sectors first) before importing WP content.',
      type: 'array',
      group: 'navigation',
      of: [
        defineField({
          name: 'navItem',
          title: 'Nav item',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'Link (path)',
              type: 'string',
              description: 'Use site paths like /sectors or /find-the-right-oil',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'href'},
          },
        }),
      ],
    }),

    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      group: 'contact',
    }),

    defineField({
      name: 'contactPhone',
      title: 'Contact phone',
      type: 'string',
      group: 'contact',
    }),

    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 3,
      group: 'contact',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site settings'}),
  },
})
