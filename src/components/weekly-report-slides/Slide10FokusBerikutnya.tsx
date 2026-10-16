import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import type { FokusPekanDepanData } from '@/types/weeklyReportTemplate'

interface Slide10FokusBerikutnyaProps {
  currentPekan: string
  periodeFormatted: string
  data: FokusPekanDepanData
}

export const Slide10FokusBerikutnya: React.FC<Slide10FokusBerikutnyaProps> = ({
  periodeFormatted,
  data,
}) => {
  const items = data.items || []

  return (
    <SlideFrame
      slideNumber={10}
      sectionCategory="FOKUS PEKAN BERIKUTNYA"
      title="Rencana Aksi &amp; Fokus Prioritas Pekan Depan"
      subtitle="Sasaran 5 pilar kurikulum untuk akselerasi hafalan, karakter, dan keterampilan santri."
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
        {/* 5 Pillars Cards Grid */}
        <div className="grid grid-cols-5 gap-2.5 flex-1 min-h-0">
          {items.slice(0, 5).map((it, idx) => (
            <div
              key={it.id || idx}
              className="rounded-lg border p-2.5 flex flex-col justify-between bg-white shadow-2xs"
              style={{ borderColor: SLIDE_THEME.borderGrey }}
            >
              <div>
                {/* Pillar Header */}
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b" style={{ borderColor: SLIDE_THEME.borderGrey }}>
                  <span
                    className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded"
                    style={{
                      backgroundColor: SLIDE_THEME.lightBlue,
                      color: SLIDE_THEME.primaryNavy,
                    }}
                  >
                    Pilar 0{idx + 1}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-500 uppercase">
                    {it.status || 'Rencana'}
                  </span>
                </div>

                <div className="text-xs font-black" style={{ color: SLIDE_THEME.primaryNavy }}>
                  {it.kategori}
                </div>

                <div className="text-[11px] font-bold text-neutral-800 mt-1 line-clamp-2">
                  {it.judul}
                </div>

                <p className="text-[10px] text-neutral-600 mt-1 line-clamp-4 leading-relaxed">
                  {it.deskripsi_target || 'Target operasional kurikulum pekanan.'}
                </p>
              </div>

              {it.indikator_keberhasilan && (
                <div
                  className="mt-2 pt-1.5 border-t text-[9px] text-neutral-500 line-clamp-2 italic"
                  style={{ borderColor: SLIDE_THEME.borderGrey }}
                >
                  Indikator: {it.indikator_keberhasilan}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Closing Statement */}
        <div
          className="p-2 sm:p-2.5 rounded-lg border text-center text-[10.5px] font-medium shrink-0"
          style={{
            backgroundColor: SLIDE_THEME.lightGrey,
            borderColor: SLIDE_THEME.borderGrey,
            color: SLIDE_THEME.textSecondary,
          }}
        >
          Komitmen Bersama Tim Pengajar &amp; Musyrif IDN Mekkah Madinah demi Terwujudnya Generasi Qur'ani Berprestasi
        </div>
      </div>
    </SlideFrame>
  )
}
