import {defineField, defineType} from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    {name: 'core', title: 'Core'},
    {name: 'specs', title: 'Specs'},
    {name: 'docs', title: 'Documents'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      group: 'core',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'core',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      group: 'core',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
      group: 'core',
    }),
    defineField({
      name: 'sectors',
      title: 'Sectors',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'sector'}]}],
      group: 'core',
    }),
    defineField({
      name: 'body',
      title: 'Product content',
      type: 'array',
      of: [{type: 'block'}],
      group: 'core',
    }),

    defineField({
      name: 'viscosityGrade',
      title: 'Viscosity grade',
      type: 'string',
      group: 'specs',
      description: 'e.g. 5W-30, ISO VG 46',
    }),
    defineField({
      name: 'approvals',
      title: 'Approvals / specs',
      type: 'array',
      of: [{type: 'string'}],
      group: 'specs',
      description: 'List key OEM approvals/specifications (simple v1).',
    }),
    defineField({
      name: 'packSizes',
      title: 'Pack sizes',
      type: 'array',
      group: 'specs',
      of: [
        {
          type: 'object',
          name: 'packSize',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. 1L, 5L, 205L'}),
            defineField({name: 'sku', title: 'SKU (optional)', type: 'string'}),
          ],
          preview: {select: {title: 'label'}},
        },
      ],
      description: 'Simple selector for now; future-ready for variants/commerce later.',
    }),

    defineField({
      name: 'technicalDocuments',
      title: 'Technical documents',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'technicalDocument'}]}],
      group: 'docs',
      description: 'Link TDS/SDS/etc documents stored in Sanity.',
    }),

    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {select: {title: 'title', media: 'mainImage'}},
})
