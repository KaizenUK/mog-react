import {defineField, defineType} from 'sanity'

export const technicalDocument = defineType({
  name: 'technicalDocument',
  title: 'Technical document',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'docType',
      title: 'Document type',
      type: 'string',
      options: {
        list: [
          {title: 'TDS (Technical Data Sheet)', value: 'tds'},
          {title: 'SDS (Safety Data Sheet)', value: 'sds'},
          {title: 'Other', value: 'other'},
        ],
        layout: 'radio',
      },
      initialValue: 'tds',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'file',
      title: 'PDF file',
      type: 'file',
      options: {accept: 'application/pdf'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      initialValue: 'en',
      description: 'e.g. en, fr, de',
    }),
    defineField({
      name: 'relatedProducts',
      title: 'Related products',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      description: 'For filtering/search in Technical Library.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'docType'},
    prepare: ({title, subtitle}) => ({
      title,
      subtitle: subtitle ? subtitle.toUpperCase() : undefined,
    }),
  },
})
