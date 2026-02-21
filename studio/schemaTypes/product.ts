import {defineField, defineType} from 'sanity'
import {LinkedTechnicalDocsPreviewInput} from './components/LinkedTechnicalDocsPreviewInput'
import {PackSizesOverviewInput} from './components/PackSizesOverviewInput'
import {ProductEditorHintsInput} from './components/ProductEditorHintsInput'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    {name: 'core', title: 'Core'},
    {name: 'nav', title: 'Navigation'},
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
      name: 'specsEditorNote',
      title: 'Specs editor note',
      type: 'string',
      group: 'specs',
      readOnly: true,
      initialValue: '',
      description:
        'Pack sizes and approvals are optional display overrides. If left blank, the storefront uses defaults or hides optional chips.',
      components: {
        input: ProductEditorHintsInput,
      },
    }),
    defineField({
      name: 'approvals',
      title: 'Approvals / specs',
      type: 'array',
      of: [{type: 'string'}],
      group: 'specs',
      description:
        'Optional override chips shown on the product page (e.g. ACEA C3, API SN). Leave blank to hide this section.',
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
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. 1L, 5L, 205L, Bulk Tanker'}),
            defineField({name: 'sku', title: 'SKU (optional)', type: 'string'}),
            defineField({
              name: 'image',
              title: 'Size image',
              type: 'image',
              options: {hotspot: true},
              description: 'Product image for this specific pack size. Falls back to main product image.',
            }),
            defineField({
              name: 'price',
              title: 'Guide price',
              type: 'string',
              description: 'Optional display price — e.g. "POA", "£12.50/L", "Call for pricing"',
            }),
            defineField({
              name: 'leadTime',
              title: 'Lead time',
              type: 'string',
              description: 'e.g. "Next day delivery", "5–7 working days", "3–5 working days"',
            }),
            defineField({
              name: 'moq',
              title: 'Minimum order quantity',
              type: 'string',
              description: 'e.g. "1 unit", "Minimum 1 drum", "Full tanker load only"',
            }),
            defineField({
              name: 'notes',
              title: 'Size notes',
              type: 'text',
              rows: 2,
              description: 'Any notes specific to this size — delivery, handling, hazmat, etc.',
            }),
          ],
          preview: {select: {title: 'label', media: 'image'}},
        },
      ],
      description:
        'Optional overrides only. The storefront already shows standard sizes by default; use this only to add per-size data (SKU/image/price/lead time/MOQ/notes).',
    }),
    defineField({
      name: 'packSizesOverview',
      title: 'Pack sizes overview',
      type: 'string',
      group: 'specs',
      readOnly: true,
      initialValue: '',
      components: {
        input: PackSizesOverviewInput,
      },
    }),
    defineField({
      name: 'unavailablePackSizes',
      title: 'Unavailable standard sizes',
      type: 'array',
      of: [{type: 'string'}],
      group: 'specs',
      description:
        'Optional hard exclusions for standard sizes (e.g. remove 1L for this product). Managed automatically from Pack sizes overview.',
    }),

    defineField({
      name: 'technicalDocuments',
      title: 'Technical documents',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'technicalDocument'}]}],
      group: 'docs',
      description:
        'Optional manual links to docs. You can also link from the Technical Document side via Related products. Frontend merges both directions and de-duplicates automatically.',
    }),
    defineField({
      name: 'docsEditorNote',
      title: 'Documents editor note',
      type: 'string',
      group: 'docs',
      readOnly: true,
      initialValue: '',
      description:
        'Linking works in both directions (Product -> Technical documents and Technical document -> Related products). The site merges and de-duplicates both lists.',
      components: {
        input: ProductEditorHintsInput,
      },
    }),
    defineField({
      name: 'linkedTechnicalDocumentsPreview',
      title: 'Linked documents overview',
      type: 'string',
      group: 'docs',
      readOnly: true,
      initialValue: '',
      components: {
        input: LinkedTechnicalDocsPreviewInput,
      },
    }),

    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),

    defineField({
      name: 'showInNav',
      title: 'Show in navigation',
      type: 'boolean',
      group: 'nav',
      description: 'Surface this product in the mega menu navigation.',
      initialValue: false,
    }),
    defineField({
      name: 'navDescription',
      title: 'Nav description',
      type: 'string',
      group: 'nav',
      description: 'One-line description shown under the product name in the nav (max ~60 chars). Falls back to Summary if blank.',
      validation: (Rule) => Rule.max(80),
      hidden: ({document}) => !document?.showInNav,
    }),
  ],
  preview: {select: {title: 'title', media: 'mainImage'}},
})
