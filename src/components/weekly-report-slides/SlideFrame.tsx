import React from 'react'
import { SLIDE_THEME } from './slideTheme'

interface SlideFrameProps {
  slideNumber: number
  totalSlides?: number
  sectionCategory: string
  title: string
  subtitle?: string
  periodeFormatted: string
  children: React.ReactNode
}

export const SlideFrame: React.FC<SlideFrameProps> = ({
  slideNumber,
  totalSlides = 10,
  sectionCategory,
  title,
  subtitle,
  periodeFormatted,
  children,
}) => {
  const padSlideNum = String(slideNumber).padStart(2, '0')

  return (
    <div
      className="relative aspect-[16/9] w-full max-w-[1280px] bg-white rounded-xl border flex flex-col justify-between p-6 sm:p-8 md:p-10 select-none overflow-hidden print:p-8 print:rounded-none print:border-none print:shadow-none shadow-sm"
      style={{
        borderColor: SLIDE_THEME.borderGrey,
        color: SLIDE_THEME.textPrimary,
      }}
    >
      {/* 1. SLIDE HEADER */}
      <div className="shrink-0 pb-3 sm:pb-3.5 mb-3 sm:mb-4 border-b" style={{ borderColor: SLIDE_THEME.borderGrey }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{
                  backgroundColor: SLIDE_THEME.lightBlue,
                  color: SLIDE_THEME.primaryNavy,
                }}
              >
                Slide {padSlideNum} • {sectionCategory}
              </span>
            </div>
            <h2
              className="text-lg sm:text-xl md:text-2xl font-black tracking-tight mt-1 truncate"
              style={{ color: SLIDE_THEME.primaryNavy }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] sm:text-xs mt-0.5 truncate" style={{ color: SLIDE_THEME.textSecondary }}>
                {subtitle}
              </p>
            )}
          </div>

          <div
            className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded border shrink-0 text-right hidden sm:block"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
              color: SLIDE_THEME.textSecondary,
            }}
          >
            {periodeFormatted}
          </div>
        </div>
      </div>

      {/* 2. SLIDE CONTENT BODY */}
      <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
        {children}
      </div>

      {/* 3. SLIDE FOOTER */}
      <div
        className="shrink-0 pt-2.5 sm:pt-3 mt-3 sm:mt-3.5 border-t flex items-center justify-between text-[10px] sm:text-[11px]"
        style={{
          borderColor: SLIDE_THEME.borderGrey,
          color: SLIDE_THEME.muted,
        }}
      >
        <span className="font-semibold text-neutral-600 truncate">
          IDN Boarding School • Program Mekkah &amp; Madinah
        </span>
        <span className="hidden md:inline font-medium">
          Periode: {periodeFormatted}
        </span>
        <span className="font-bold text-neutral-700">
          Slide {slideNumber} dari {totalSlides}
        </span>
      </div>
    </div>
  )
}
