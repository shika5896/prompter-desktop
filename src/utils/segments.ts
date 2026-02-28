import type { Segment } from '../types/manuscript'

/** Merge adjacent text segments into one, ensuring at least one segment exists */
export function mergeAdjacentText(segments: Segment[]): Segment[] {
  const merged: Segment[] = []
  for (const seg of segments) {
    const last = merged[merged.length - 1]
    if (seg.type === 'text' && last?.type === 'text') {
      last.content += seg.content
    } else {
      merged.push(seg)
    }
  }
  if (merged.length === 0) {
    merged.push({ type: 'text', content: '' })
  }
  return merged
}
