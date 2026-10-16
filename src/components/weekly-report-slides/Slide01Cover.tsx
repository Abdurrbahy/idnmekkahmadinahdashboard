import React from 'react'
import logoIDN from '@/assets/logo-idn-mekkah-madinah.png'
import { SLIDE_THEME } from './slideTheme'
import type { WeeklyReportMetadata } from '@/types/weeklyReportTemplate'

interface Slide01CoverProps {
  metadata: WeeklyReportMetadata
  currentPekan: string
  periodeFormatted: string
  preparedDateFormatted?: string
}

export const Slide01Cover: React.FC<Slide01CoverProps> = ({
  metadata,
  periodeFormatted,
  preparedDateFormatted,
}) => {
  return (
    <div
      className="relative aspect-[16/9] w-full max-w-[1280px] bg-white rounded-xl border flex flex-col justify-between p-8 sm:p-12 md:p-16 select-none overflow-hidden print:p-10 print:rounded-none print:border-none print:shadow-none shadow-sm"
      style={{
        borderColor: SLIDE_THEME.borderGrey,
      }}
    >
      {/* Top Header with Official Logo */}
      <div className="flex items-center justify-between border-b pb-4 sm:pb-6" style={{ borderColor: SLIDE_THEME.borderGrey }}>
        <img
          src={logoIDN}
          alt="IDN Boarding School"
          className="h-10 sm:h-12 md:h-14 w-auto object-contain"
        />
        <div
          className="text-right text-[11px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded"
          style={{
            backgroundColor: SLIDE_THEME.lightBlue,
            color: SLIDE_THEME.primaryNavy,
          }}
        >
          {metadata.cabang || 'Cabang Mekkah & Madinah'}
        </div>
      </div>

      {/* Main Cover Title & Period */}
      <div className="my-auto py-6 sm:py-10 space-y-4 sm:space-y-6">
        {/* Accent Bar */}
        <div className="w-16 sm:w-20 h-1.5 rounded-full" style={{ backgroundColor: SLIDE_THEME.primaryNavy }} />

        <div>
          <span
            className="text-xs sm:text-sm font-bold tracking-widest uppercase block mb-1"
            style={{ color: SLIDE_THEME.secondaryBlue }}
          >
            Executive Weekly Management Report
          </span>
          <h1
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
            style={{ color: SLIDE_THEME.primaryNavy }}
          >
            {metadata.nama_laporan || 'LAPORAN PEKANAN PROGRAM'}
          </h1>
        </div>

        {/* Period Details Box */}
        <div
          className="inline-flex flex-wrap items-center gap-3 sm:gap-6 p-3 sm:p-4 rounded-xl border"
          style={{
            backgroundColor: SLIDE_THEME.lightGrey,
            borderColor: SLIDE_THEME.borderGrey,
          }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase block" style={{ color: SLIDE_THEME.textSecondary }}>
              Periode
            </span>
            <span className="text-xs sm:text-sm font-extrabold" style={{ color: SLIDE_THEME.textPrimary }}>
              {periodeFormatted}
            </span>
          </div>

          <div className="hidden sm:block w-px h-8" style={{ backgroundColor: SLIDE_THEME.borderGrey }} />

          <div>
            <span className="text-[10px] font-bold uppercase block" style={{ color: SLIDE_THEME.textSecondary }}>
              Rentang Tanggal (Ahad — Sabtu)
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono" style={{ color: SLIDE_THEME.textPrimary }}>
              {metadata.tanggal_awal} s/d {metadata.tanggal_akhir}
            </span>
          </div>

          <div className="hidden sm:block w-px h-8" style={{ backgroundColor: SLIDE_THEME.borderGrey }} />

          <div>
            <span className="text-[10px] font-bold uppercase block" style={{ color: SLIDE_THEME.textSecondary }}>
              Pekan Ke-
            </span>
            <span className="text-xs sm:text-sm font-black" style={{ color: SLIDE_THEME.primaryNavy }}>
              Pekan {metadata.pekan_ke} • {metadata.bulan} {metadata.tahun}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div
        className="border-t pt-4 sm:pt-5 flex items-center justify-between text-[11px] sm:text-xs"
        style={{
          borderColor: SLIDE_THEME.borderGrey,
          color: SLIDE_THEME.textSecondary,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Koordinator / Penyusun:</span>
          <span className="font-extrabold" style={{ color: SLIDE_THEME.textPrimary }}>
            {metadata.koordinator || 'Koordinator Program IDN'}
          </span>
        </div>
        <div className="italic text-[10px] sm:text-[11px]">
          {preparedDateFormatted ? `Disiapkan pada ${preparedDateFormatted}` : 'Standar IDN Mekkah & Madinah'}
        </div>
      </div>
    </div>
  )
}
