type Seo = {
  title?: string
  description?: string
  canonicalUrl?: string
  noIndex?: boolean
}

export function mergeSeo(base: Seo | null | undefined, page: Seo | null | undefined): Seo {
  return {
    title: page?.title ?? base?.title,
    description: page?.description ?? base?.description,
    canonicalUrl: page?.canonicalUrl ?? base?.canonicalUrl,
    noIndex: page?.noIndex ?? base?.noIndex ?? false,
  }
}
