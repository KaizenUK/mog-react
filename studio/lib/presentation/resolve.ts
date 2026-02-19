import {defineDocuments, defineLocations} from 'sanity/presentation'

export const locations = {
  product: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [
        {title: doc?.title || 'Product', href: `/product/${doc?.slug}`},
        {title: 'All products', href: '/products'},
      ],
    }),
  }),

  sector: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [{title: doc?.title || 'Sector', href: `/sector/${doc?.slug}`}],
    }),
  }),

  service: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [{title: doc?.title || 'Service', href: `/services/${doc?.slug}`}],
    }),
  }),

  post: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [{title: doc?.title || 'Post', href: `/blog/${doc?.slug}`}],
    }),
  }),
}

export const mainDocuments = defineDocuments([
  {
    route: '/product/:slug',
    filter: `_type == "product" && slug.current == $slug`,
  },
  {
    route: '/sector/:slug',
    filter: `_type == "sector" && slug.current == $slug`,
  },
  {
    route: '/services/:slug',
    filter: `_type == "service" && slug.current == $slug`,
  },
  {
    route: '/blog/:slug',
    filter: `_type == "post" && slug.current == $slug`,
  },
])
