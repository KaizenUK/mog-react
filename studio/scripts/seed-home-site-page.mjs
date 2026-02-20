/* eslint-disable no-console */
/* global process */

import {createClient} from '@sanity/client'
import {randomUUID} from 'node:crypto'

const projectId =
  process.env.SANITY_PROJECT_ID ?? process.env.SANITY_STUDIO_PROJECT_ID ?? 'kq3z2s2d'
const dataset = process.env.SANITY_DATASET ?? process.env.SANITY_STUDIO_DATASET ?? 'production'
const apiVersion =
  process.env.SANITY_API_VERSION ?? process.env.SANITY_STUDIO_API_VERSION ?? '2025-02-01'
const token =
  process.env.SANITY_AUTH_TOKEN ??
  process.env.SANITY_STUDIO_API_TOKEN ??
  process.env.SANITY_API_WRITE_TOKEN

if (!token) {
  console.error(
    'Missing required write token env var:\n' +
      '- SANITY_AUTH_TOKEN (or SANITY_STUDIO_API_TOKEN / SANITY_API_WRITE_TOKEN)'
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const HOME_SLUG = 'home'

const withKeys = (items) =>
  items.map((item) => ({
    _key: randomUUID().replace(/-/g, '').slice(0, 12),
    ...item,
  }))

const defaults = {
  title: 'Home',
  slug: {_type: 'slug', current: HOME_SLUG},
  hero: {
    eyebrow: 'Lubricant Suppliers & Manufacturers · West Midlands',
    headlineLines: ['UK Lubricant', 'Specialists'],
    introText:
      "Welcome to Midland Oil Group, a leading UK lubricant supplier, manufacturer and wholesaler based in the West Midlands. We specialise in the manufacture of high-performance engine oils, gear oils and industrial oils for automotive, agricultural and industrial sectors.",
    bodyText:
      "We are a group of companies capable of completing the full sustainable circle of a lubricant's lifespan. We combine over 150 years' experience to offer a complete solution for our clients in the oil and lubricants industry.",
    ctas: withKeys([
      {_type: 'cta', label: 'Find the Right Oil', href: '/find-the-right-oil', variant: 'primary'},
      {_type: 'cta', label: 'Our Products', href: '/products', variant: 'secondary'},
    ]),
    badges: ['UK Manufacturer', '150+ Years Combined Experience', 'West Midlands Based'],
  },
  authorityIntro: {
    eyebrow: 'About Midland Oil Group',
    heading: 'Lubricant Suppliers & Manufacturers\nWest Midlands, UK',
    paragraphOne:
      "When you need reliable, high-performing oils and lubricants, Midland Oil Group is one of the UK's leading lubricant suppliers — manufacturing everything from engine oils and industrial oils to agricultural oils and metalworking fluids.",
    paragraphTwo:
      'As an independently owned UK manufacturer based in the West Midlands, we combine over 150 years of industry experience with an in-house laboratory, blending facility, and nationwide distribution network.',
  },
  capabilitiesSection: {
    lead: "With over 150 years' combined experience, we provide a complete in-house service — from new oil manufacturing to waste oil regeneration — for end-users, distributors, and blenders across the UK.",
    tiles: withKeys([
      {
        _type: 'tile',
        title: 'New Oil Manufacturing',
        description:
          'UK-manufactured lubricants to strict batch standards with full quality control.',
      },
      {
        _type: 'tile',
        title: 'Waste Oil Regeneration',
        description:
          'End-of-life lubricants restored to new-oil specification using 70-year-proven methods.',
      },
      {
        _type: 'tile',
        title: 'Own-Label Toll Blending',
        description:
          'Bespoke blending, in-house graphic design, and fully custom-branded packaging runs.',
      },
      {
        _type: 'tile',
        title: 'Laboratory R&D',
        description:
          'In-house formulation, product testing, and full approval pipelines for new lubricants.',
      },
      {
        _type: 'tile',
        title: 'Small-Pack Filling',
        description:
          'Specialist filling from syringes to automotive packs — NHS, chemical, and lubricant lines.',
      },
      {
        _type: 'tile',
        title: 'Nationwide Distribution',
        description: 'Efficient packaging and next-day bulk supply across the whole of the UK.',
      },
    ]),
    callout:
      "A unique service offering to the lubricant industry: we take end-of-life lubricants classified as waste and regenerate them back into the industry as new oils. Using tried and tested engineering methods dating back over 70 years, we deliver sustainable, environmentally-friendly solutions — a powerful tool in today's world.",
  },
  statsSection: {
    items: withKeys([
      {
        _type: 'stat',
        figure: '5,000+',
        countTo: 5000,
        label: 'Products',
        sentence:
          'Across our brand portfolio, with bespoke formulation available for specific client needs via our in-house laboratory team.',
      },
      {
        _type: 'stat',
        figure: '40+',
        countTo: 40,
        label: "Years' Experience",
        sentence:
          'In specialist small-pack filling — from NHS syringes and pharmaceutical lines to automotive and industrial packs.',
      },
      {
        _type: 'stat',
        figure: '250+',
        countTo: 250,
        label: 'Industrial Products',
        sentence:
          'Covering cutting fluids, metalworking lubricants, and engineering oils for the manufacturing and engineering sectors.',
      },
    ]),
  },
  whyChooseSection: {
    heading: 'Why Choose Midland Oil Group?',
    intro:
      "With a fully integrated approach to the lubricant lifecycle — from formulation and manufacturing to waste oil collection and regeneration — we offer an all-in-one solution as the UK's go-to lubricant supplier.",
    items: withKeys([
      {
        _type: 'item',
        label: 'Cost-Saving Solutions',
        detail: 'Buy in bulk from our wholesale operation to reduce your unit costs significantly.',
      },
      {
        _type: 'item',
        label: 'Industry Expertise',
        detail:
          "Over 150 years' combined experience in lubricant formulation, manufacturing, and recycling.",
      },
      {
        _type: 'item',
        label: '5,000+ Products',
        detail:
          'Across automotive, industrial, agricultural, and manufacturing sectors — something for every application.',
      },
      {
        _type: 'item',
        label: 'In-House R&D',
        detail:
          'Expert testing, analysis, and customisable formulations from our on-site laboratory team.',
      },
      {
        _type: 'item',
        label: 'Experienced Team',
        detail: 'Local industry experts guide you to the right lubricant, with bespoke solutions on offer.',
      },
      {
        _type: 'item',
        label: 'Nationwide Delivery',
        detail: 'We ship and bulk-supply oils across the whole of the UK, often next day.',
      },
    ]),
    calloutBody:
      'We work closely with distributors, resellers, and manufacturers requiring own-label products. With in-house graphic design and a dedicated printing facility, we deliver bespoke, custom-branded packaging — from single-run client-specific orders to large multi-batch programmes.',
  },
  finalCtaSection: {
    heading: 'Lubricant Manufacturers & Wholesalers West Midlands',
    primaryLabel: 'Find the Right Oil',
    primaryHref: '/products',
    secondaryLabel: 'Our Products',
    secondaryHref: '/products',
    ghostLabel: 'Contact Us',
    ghostHref: '/contact',
  },
  lifecycleSection: {
    sectionLabel: 'The Complete Lubricant Lifecycle',
    pillars: withKeys([
      {
        _type: 'pillar',
        ordinal: '01',
        title: 'Formulation',
        body: 'Through the extensive laboratory work, the product is developed through thorough R&D, supported trials and then finally approvals for the launch of a new lubricant to market.',
      },
      {
        _type: 'pillar',
        ordinal: '02',
        title: 'Manufacture',
        body: 'Manufactured in Halesowen, UK, the product follows a strict laboratory batch method, quality control is applied throughout testing, until passing final inspection and packaged for delivery to our customers.',
      },
      {
        _type: 'pillar',
        ordinal: '03',
        title: 'Regeneration',
        body: "When a lubricant is deemed end of life, we have the expertise, plant and ability to regenerate the lubricant back to a new oil specification, just like a newly manufactured lubricant and extremely powerful tool in today's world.",
      },
      {
        _type: 'pillar',
        ordinal: '04',
        title: 'Disposal',
        body: "At a lubricant's end of life when we cannot regenerate, we have all permits to allow for disposal. This provides our clients with a fully sustainable partner who can supply, re-generate or - worst case - dispose of.",
      },
    ]),
  },
}

function mergeMissing(current, fallback) {
  if (current === undefined || current === null) return fallback

  if (Array.isArray(fallback)) {
    if (!Array.isArray(current) || current.length === 0) return fallback

    return fallback.map((fallbackItem, idx) => mergeMissing(current[idx], fallbackItem))
  }

  if (typeof fallback === 'object' && fallback !== null) {
    if (typeof current !== 'object' || current === null) return fallback

    const merged = {...current}
    for (const [key, fallbackValue] of Object.entries(fallback)) {
      merged[key] = mergeMissing(current[key], fallbackValue)
    }
    return merged
  }

  if (typeof fallback === 'string') {
    return String(current).trim() ? current : fallback
  }

  return current ?? fallback
}

async function main() {
  const existing = await client.fetch(
    `*[_type == "sitePage" && slug.current == $slug][0]`,
    {slug: HOME_SLUG}
  )

  if (!existing) {
    const created = await client.create({
      _id: 'sitePage-home',
      _type: 'sitePage',
      ...defaults,
    })
    console.log(`Created home sitePage: ${created._id}`)
    return
  }

  const merged = mergeMissing(existing, defaults)
  await client.patch(existing._id).set(merged).commit()
  console.log(`Updated home sitePage defaults on: ${existing._id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
