import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    {name: 'general', title: 'General'},
    {name: 'seo', title: 'SEO'},
    {name: 'contact', title: 'Contact'},
  ],
  fields: [
    defineField({name: 'siteName', title: 'Site name', type: 'string', group: 'general'}),
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'seo',
      group: 'seo',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      group: 'contact',
    }),
    defineField({name: 'contactPhone', title: 'Contact phone', type: 'string', group: 'contact'}),
    defineField({name: 'address', title: 'Address', type: 'text', rows: 3, group: 'contact'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
