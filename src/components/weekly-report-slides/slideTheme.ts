/**
 * Central design tokens for Weekly Report Coordinator 16:9 Slides
 * Follows minimal, professional, and corporate aesthetic guidelines.
 */

export const SLIDE_THEME = {
  primaryNavy: '#17365D',
  secondaryBlue: '#426B93',
  lightBlue: '#EAF1F7',
  white: '#FFFFFF',
  lightGrey: '#F5F6F7',
  borderGrey: '#D9DEE5',
  textPrimary: '#171A1F',
  textSecondary: '#68717D',
  muted: '#98A1AC',
} as const

export interface SlideCommonProps {
  slideNumber: number
  totalSlides?: number
  currentPekan: string
  periodeFormatted: string
  cabang?: string
}
