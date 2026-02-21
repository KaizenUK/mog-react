import {toHTML} from '@portabletext/to-html'

export function portableTextToHtml(value: any) {
  if (!Array.isArray(value) || value.length === 0) return ''

  try {
    return toHTML(value)
  } catch (error) {
    console.error('[portableTextToHtml] Failed to render Portable Text:', error)
    return ''
  }
}
