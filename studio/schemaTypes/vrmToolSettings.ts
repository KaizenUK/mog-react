import {defineField, defineType} from 'sanity'

export const vrmToolSettings = defineType({
  name: 'vrmToolSettings',
  title: 'VRM tool settings',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content'},
    {name: 'provider', title: 'Provider config'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'pageTitle',
      title: 'Page title',
      type: 'string',
      group: 'content',
      initialValue: 'Find the right oil',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'array',
      of: [{type: 'block'}],
      group: 'content',
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faq',
          fields: [
            {name: 'question', title: 'Question', type: 'string'},
            {name: 'answer', title: 'Answer', type: 'array', of: [{type: 'block'}]},
          ],
          preview: {select: {title: 'question'}},
        },
      ],
      group: 'content',
    }),

    defineField({
      name: 'enabled',
      title: 'Enable VRM tool',
      type: 'boolean',
      initialValue: false,
      group: 'provider',
    }),
    defineField({
      name: 'providerName',
      title: 'Provider name',
      type: 'string',
      group: 'provider',
    }),
    defineField({
      name: 'providerBaseUrl',
      title: 'Provider base URL',
      type: 'url',
      group: 'provider',
      description: 'Base URL for the VRM API (no secrets here).',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      group: 'provider',
      description: 'Internal notes about provider setup, licensing, limits, etc.',
    }),

    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'VRM tool settings'})},
})
