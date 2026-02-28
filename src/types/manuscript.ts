export type SegmentType = 'text' | 'ruby'

export interface TextSegment {
  type: 'text'
  content: string
}

export interface RubySegment {
  type: 'ruby'
  base: string
  reading: string
}

export type Segment = TextSegment | RubySegment

export interface Slide {
  segments: Segment[]
  key_binding?: string
  font_size?: number
  font_color?: string
}

export interface Manuscript {
  title: string
  created: string
  slides: Slide[]
}
