import {defineDocuments, defineLocations} from 'sanity/presentation'

export const locations = {
  // ── sitePage: homepage + any CMS-managed flat pages ───────────────────────
  sitePage: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => {
      const slug = doc?.slug
      const href = slug === 'home' ? '/' : `/${slug}`
      return {
        locations: [{title: doc?.title || 'Page', href}],
      }
    },
  }),

  // ── Products ──────────────────────────────────────────────────────────────
  product: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [
        {title: doc?.title || 'Product', href: `/products/${doc?.slug}`},
        {title: 'All Products', href: '/products'},
      ],
    }),
  }),

  // ── Sectors ───────────────────────────────────────────────────────────────
  sector: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [{title: doc?.title || 'Sector', href: `/sectors/${doc?.slug}`}],
    }),
  }),

  // ── Services ──────────────────────────────────────────────────────────────
  service: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [{title: doc?.title || 'Service', href: `/services/${doc?.slug}`}],
    }),
  }),

  // ── Blog / News ───────────────────────────────────────────────────────────
  post: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [{title: doc?.title || 'Post', href: `/blog/${doc?.slug}`}],
    }),
  }),
}

export const mainDocuments = defineDocuments([
  // Homepage — sitePage with slug "home" maps to "/"
  {
    route: '/',
    filter: `_type == "sitePage" && slug.current == "home"`,
  },
  // Other flat site pages
  {
    route: '/:slug',
    filter: `_type == "sitePage" && slug.current == $slug`,
  },
  // Products
  {
    route: '/products/:slug',
    filter: `_type == "product" && slug.current == $slug`,
  },
  // Sectors
  {
    route: '/sectors/:slug',
    filter: `_type == "sector" && slug.current == $slug`,
  },
  // Services
  {
    route: '/services/:slug',
    filter: `_type == "service" && slug.current == $slug`,
  },
  // Blog
  {
    route: '/blog/:slug',
    filter: `_type == "post" && slug.current == $slug`,
  },
])
