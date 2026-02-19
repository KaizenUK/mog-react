import groq from 'groq'

export const NEWS_LIST_QUERY = groq`
  *[_type == "post" && defined(slug.current)]
  | order(coalesce(publishedAt, _createdAt) desc)[0...50]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    _createdAt
  }
`

export const NEWS_BY_SLUG_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    _createdAt,
    mainImage,
    body
  }
`
