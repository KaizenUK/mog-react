import groq from 'groq'
import {sanityClient} from './client'

export async function getSiteSettings() {
  return sanityClient.fetch(groq`
    *[_type == "siteSettings"][0]{
      siteName,
      defaultSeo
    }
  `)
}
