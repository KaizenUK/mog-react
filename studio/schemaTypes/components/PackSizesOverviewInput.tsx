import {useMemo, useState} from 'react'
import {useClient, useFormValue} from 'sanity'

type PackSizeItem = {
  _key?: string
  label?: string
  sku?: string
  price?: string
}

const CANONICAL: readonly string[] = [
  '1L',
  '5L',
  '20L',
  '25L',
  '200L',
  '205L',
  '208L',
  '1000L',
  'Bulk Tanker',
]

export function PackSizesOverviewInput() {
  const client = useClient({apiVersion: '2025-02-01'})
  const rawId = useFormValue(['_id']) as string | undefined
  const packSizes = (useFormValue(['packSizes']) as PackSizeItem[] | undefined) || []
  const unavailablePackSizes = (useFormValue(['unavailablePackSizes']) as string[] | undefined) || []

  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unavailableSet = useMemo(() => new Set(unavailablePackSizes.map((s) => String(s))), [unavailablePackSizes])

  const configuredByLabel = useMemo(() => {
    const m = new Map<string, PackSizeItem[]>()
    for (const p of packSizes) {
      const label = String(p?.label || '').trim()
      if (!label) continue
      if (!m.has(label)) m.set(label, [])
      m.get(label)?.push(p)
    }
    return m
  }, [packSizes])

  const customConfigured = useMemo(() => {
    return packSizes.filter((p) => {
      const label = String(p?.label || '').trim()
      return label && !CANONICAL.includes(label)
    })
  }, [packSizes])

  async function removePackSize(item: PackSizeItem) {
    if (!rawId) return
    if (!item?._key) {
      setError('Cannot remove this row because it has no _key. Remove it directly in Pack sizes.')
      return
    }

    setBusyKey(`remove:${item._key}`)
    setError(null)
    try {
      const safeKey = String(item._key).replace(/"/g, '\\"')
      await client.patch(String(rawId)).unset([`packSizes[_key=="${safeKey}"]`]).commit()
    } catch (e: any) {
      setError(e?.message || 'Failed to remove pack size')
    } finally {
      setBusyKey(null)
    }
  }

  async function markUnavailable(label: string) {
    if (!rawId || unavailableSet.has(label)) return

    setBusyKey(`block:${label}`)
    setError(null)
    try {
      const safeLabel = String(label).replace(/"/g, '\\"')
      await client
        .patch(String(rawId))
        .setIfMissing({unavailablePackSizes: []})
        .insert('after', 'unavailablePackSizes[-1]', [label])
        .unset([`packSizes[label=="${safeLabel}"]`])
        .commit()
    } catch (e: any) {
      setError(e?.message || 'Failed to mark size unavailable')
    } finally {
      setBusyKey(null)
    }
  }

  async function allowSize(label: string) {
    if (!rawId || !unavailableSet.has(label)) return

    setBusyKey(`allow:${label}`)
    setError(null)
    try {
      const safeLabel = String(label).replace(/"/g, '\\"')
      await client.patch(String(rawId)).unset([`unavailablePackSizes[@=="${safeLabel}"]`]).commit()
    } catch (e: any) {
      setError(e?.message || 'Failed to allow size')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div style={{border: '1px solid #e5e7eb', borderRadius: 6, padding: 12}}>
      <div style={{fontWeight: 600, fontSize: 12, marginBottom: 6}}>Pack sizes overview</div>
      <div style={{fontSize: 12, opacity: 0.8, marginBottom: 10}}>
        Shows all standard sizes. Mark a size unavailable to remove it from storefront/cart for this product.
      </div>

      {error ? <div style={{fontSize: 12, color: '#b91c1c', marginBottom: 8}}>{error}</div> : null}

      <div style={{display: 'grid', gap: 8, marginBottom: customConfigured.length > 0 ? 14 : 0}}>
        {CANONICAL.map((label) => {
          const entries = configuredByLabel.get(label) || []
          const configured = entries.length > 0
          const unavailable = unavailableSet.has(label)

          return (
            <div key={label} style={{border: '1px solid #e5e7eb', borderRadius: 6, padding: 10}}>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8}}>
                <span style={{fontSize: 13}}>{label}</span>
                {configured ? (
                  <span style={{fontSize: 11, border: '1px solid #cbd5e1', borderRadius: 999, padding: '2px 8px'}}>
                    Configured override
                  </span>
                ) : (
                  <span style={{fontSize: 11, border: '1px solid #cbd5e1', borderRadius: 999, padding: '2px 8px'}}>
                    Default available
                  </span>
                )}
                {unavailable ? (
                  <span style={{fontSize: 11, border: '1px solid #fca5a5', borderRadius: 999, padding: '2px 8px'}}>
                    Unavailable
                  </span>
                ) : null}
                {configured && entries[0]?.sku ? (
                  <span style={{fontSize: 11, border: '1px solid #cbd5e1', borderRadius: 999, padding: '2px 8px'}}>
                    SKU: {entries[0].sku}
                  </span>
                ) : null}
              </div>

              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {unavailable ? (
                  <button
                    type="button"
                    disabled={busyKey !== null}
                    onClick={() => allowSize(label)}
                    style={{fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #86efac', background: '#fff'}}
                  >
                    {busyKey === `allow:${label}` ? 'Updating...' : 'Allow size'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyKey !== null}
                    onClick={() => markUnavailable(label)}
                    style={{fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff'}}
                  >
                    {busyKey === `block:${label}` ? 'Updating...' : 'Mark unavailable'}
                  </button>
                )}

                {configured
                  ? entries.map((item) => (
                      <button
                        key={item._key || `${label}-row`}
                        type="button"
                        disabled={busyKey !== null}
                        onClick={() => removePackSize(item)}
                        style={{fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff'}}
                      >
                        {busyKey === `remove:${item._key}` ? 'Removing...' : 'Remove override row'}
                      </button>
                    ))
                  : null}
              </div>
            </div>
          )
        })}
      </div>

      {customConfigured.length > 0 ? (
        <>
          <div style={{fontWeight: 600, fontSize: 12, marginBottom: 8}}>Custom sizes</div>
          <div style={{display: 'grid', gap: 8}}>
            {customConfigured.map((item) => (
              <div key={item._key || item.label} style={{border: '1px solid #e5e7eb', borderRadius: 6, padding: 10}}>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8}}>
                  <span style={{fontSize: 13}}>{item.label || 'Unnamed size'}</span>
                  {item.sku ? (
                    <span style={{fontSize: 11, border: '1px solid #cbd5e1', borderRadius: 999, padding: '2px 8px'}}>
                      SKU: {item.sku}
                    </span>
                  ) : null}
                  {item.price ? (
                    <span style={{fontSize: 11, border: '1px solid #86efac', borderRadius: 999, padding: '2px 8px'}}>
                      {item.price}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={busyKey !== null}
                  onClick={() => removePackSize(item)}
                  style={{fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff'}}
                >
                  {busyKey === `remove:${item._key}` ? 'Removing...' : 'Remove custom size'}
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
