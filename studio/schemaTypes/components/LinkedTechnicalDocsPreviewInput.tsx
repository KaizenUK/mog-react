import {useEffect, useMemo, useState} from 'react'
import {useClient, useFormValue} from 'sanity'

type DocItem = {
  _id: string
  title?: string
  docType?: string
  direct?: boolean
  reverse?: boolean
}

export function LinkedTechnicalDocsPreviewInput() {
  const client = useClient({apiVersion: '2025-02-01'})

  const rawId = useFormValue(['_id']) as string | undefined
  const directRefs = (useFormValue(['technicalDocuments']) as Array<{_ref?: string}> | undefined) || []

  const publishedId = rawId ? String(rawId).replace(/^drafts\./, '') : ''
  const draftId = publishedId ? `drafts.${publishedId}` : ''

  const directIds = useMemo(() => {
    return [...new Set(directRefs.map((r) => String(r?._ref || '')).filter(Boolean))].sort()
  }, [directRefs])

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<DocItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  async function removeDirectLink(docId: string) {
    if (!rawId) return
    setBusyKey(`direct:${docId}`)
    setError(null)
    try {
      const safeId = String(docId).replace(/"/g, '\\"')
      await client.patch(String(rawId)).unset([`technicalDocuments[_ref=="${safeId}"]`]).commit()
      setItems((prev) =>
        prev
          .map((item) => (item._id === docId ? {...item, direct: false} : item))
          .filter((item) => item.direct || item.reverse)
      )
    } catch (e: any) {
      setError(e?.message || 'Failed to remove direct link')
    } finally {
      setBusyKey(null)
    }
  }

  async function removeReverseLink(docId: string) {
    if (!publishedId) return
    setBusyKey(`reverse:${docId}`)
    setError(null)
    try {
      const safePublished = String(publishedId).replace(/"/g, '\\"')
      const safeDraft = String(draftId).replace(/"/g, '\\"')
      await client
        .patch(docId)
        .unset([
          `relatedProducts[_ref=="${safePublished}"]`,
          `relatedProducts[_ref=="${safeDraft}"]`,
        ])
        .commit()

      setItems((prev) =>
        prev
          .map((item) => (item._id === docId ? {...item, reverse: false} : item))
          .filter((item) => item.direct || item.reverse)
      )
    } catch (e: any) {
      setError(e?.message || 'Failed to remove reverse link')
    } finally {
      setBusyKey(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!publishedId) {
        setItems([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [directDocs, reverseDocs] = await Promise.all([
          directIds.length > 0
            ? client.fetch(
                `*[_type == "technicalDocument" && _id in $ids]{_id, title, docType}`,
                {ids: directIds}
              )
            : Promise.resolve([]),
          client.fetch(
            `*[_type == "technicalDocument" && (references($publishedId) || references($draftId))]{_id, title, docType}`,
            {publishedId, draftId}
          ),
        ])

        const merged = new Map<string, DocItem>()

        for (const d of directDocs as DocItem[]) {
          merged.set(d._id, {...d, direct: true, reverse: false})
        }

        for (const r of reverseDocs as DocItem[]) {
          const existing = merged.get(r._id)
          if (existing) {
            merged.set(r._id, {...existing, reverse: true})
          } else {
            merged.set(r._id, {...r, direct: false, reverse: true})
          }
        }

        const sorted = [...merged.values()].sort((a, b) => {
          const ta = (a.title || '').toLowerCase()
          const tb = (b.title || '').toLowerCase()
          return ta.localeCompare(tb)
        })

        if (!cancelled) setItems(sorted)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load linked documents')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [client, publishedId, draftId, directIds.join('|')])

  return (
    <div style={{border: '1px solid #e5e7eb', borderRadius: 6, padding: 12}}>
      <div style={{fontWeight: 600, fontSize: 12, marginBottom: 6}}>Linked documents overview</div>
      <div style={{fontSize: 12, opacity: 0.8, marginBottom: 10}}>
          Shows documents linked directly in this Product and documents linked from Technical Document {'>'} Related products.
      </div>

        {loading ? (
          <div style={{fontSize: 12, opacity: 0.8}}>Loading linked documents...</div>
        ) : error ? (
          <div style={{fontSize: 12, color: '#b91c1c'}}>{error}</div>
        ) : items.length === 0 ? (
          <div style={{fontSize: 12, opacity: 0.8}}>No linked technical documents yet.</div>
        ) : (
          <div style={{display: 'grid', gap: 8}}>
            {items.map((item) => (
              <div key={item._id} style={{border: '1px solid #e5e7eb', borderRadius: 6, padding: 10}}>
                <div style={{fontSize: 13, marginBottom: 8}}>{item.title || item._id}</div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
                  {item.docType ? (
                    <span style={{fontSize: 11, border: '1px solid #cbd5e1', borderRadius: 999, padding: '2px 8px'}}>
                      {String(item.docType).toUpperCase()}
                    </span>
                  ) : null}
                  {item.direct ? (
                    <span style={{fontSize: 11, border: '1px solid #86efac', borderRadius: 999, padding: '2px 8px'}}>
                      Direct
                    </span>
                  ) : null}
                  {item.reverse ? (
                    <span style={{fontSize: 11, border: '1px solid #fcd34d', borderRadius: 999, padding: '2px 8px'}}>
                      Related products
                    </span>
                  ) : null}
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                    {item.direct ? (
                      <button
                        type="button"
                        disabled={busyKey !== null}
                        onClick={() => removeDirectLink(item._id)}
                        style={{fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff'}}
                      >
                        {busyKey === `direct:${item._id}` ? 'Removing...' : 'Remove direct link'}
                      </button>
                    ) : null}
                    {item.reverse ? (
                      <button
                        type="button"
                        disabled={busyKey !== null}
                        onClick={() => removeReverseLink(item._id)}
                        style={{fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff'}}
                      >
                        {busyKey === `reverse:${item._id}` ? 'Removing...' : 'Remove related-products link'}
                      </button>
                    ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
