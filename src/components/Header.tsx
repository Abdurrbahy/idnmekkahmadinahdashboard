import React, { useEffect, useState, useMemo } from 'react'
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Printer,
  AlertCircle,
} from 'lucide-react'
import { Button } from './ui/button'
import {
  todayRiyadh,
  formatDateRiyadh,
  formatDateShortRiyadh,
  addDaysToDate,
  pekanMulai,
  pekanSelesai,
  formatPekanDisplay,
  formatPekanMobile,
  isHariAktif,
} from '@/lib/dateUtils'
import { nomorPekanBulan } from '@/lib/printUtils'
import { fetchDailyCompleteness } from '@/lib/supabase'

export type ViewMode = 'daily' | 'weekly'

interface HeaderProps {
  pageTitle?: string
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  selectedDate: string
  onDateChange: (date: string) => void
  onToggleSidebar?: () => void
  isConfigured?: boolean
  onOpenConfig?: () => void
  hasUnsavedChanges?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle = 'Input Harian',
  viewMode = 'daily',
  onViewModeChange,
  selectedDate,
  onDateChange,
  onToggleSidebar,
  isConfigured = true,
  onOpenConfig,
  hasUnsavedChanges = false,
}) => {
  const currentPekanMulai = pekanMulai(selectedDate)
  const isCurrentToday = selectedDate === todayRiyadh()
  const isCurrentThisWeek = currentPekanMulai === pekanMulai(todayRiyadh())

  const [isWeekIncomplete, setIsWeekIncomplete] = useState(false)

  // Fetch completeness for current week to show warning dot if data is missing
  useEffect(() => {
    let isMounted = true
    const pAkhir = pekanSelesai(currentPekanMulai)
    fetchDailyCompleteness(currentPekanMulai, pAkhir)
      .then((records) => {
        if (!isMounted) return
        // Count active days (Ahad-Kamis)
        // If an active day has 0 attendance or 0 mutabaah, mark as incomplete
        const activeDaysWithData = records.filter(
          (r) => isHariAktif(r.tanggal) && (r.n_presensi > 0 || r.n_mutabaah > 0)
        ).length
        // If less than 5 active days filled
        setIsWeekIncomplete(activeDaysWithData < 5)
      })
      .catch(() => {
        if (isMounted) setIsWeekIncomplete(false)
      })
    return () => {
      isMounted = false
    }
  }, [currentPekanMulai])

  const confirmIfUnsaved = (): boolean => {
    if (hasUnsavedChanges) {
      return window.confirm(
        'Ada data yang belum tersimpan. Perubahan Anda akan hilang jika berpindah halaman. Lanjutkan?'
      )
    }
    return true
  }

  const handlePrev = () => {
    if (!confirmIfUnsaved()) return
    if (viewMode === 'daily') {
      onDateChange(addDaysToDate(selectedDate, -1))
    } else {
      onDateChange(addDaysToDate(currentPekanMulai, -7))
    }
  }

  const handleNext = () => {
    if (!confirmIfUnsaved()) return
    if (viewMode === 'daily') {
      onDateChange(addDaysToDate(selectedDate, 1))
    } else {
      onDateChange(addDaysToDate(currentPekanMulai, 7))
    }
  }

  const handleTodayOrThisWeek = () => {
    if (!confirmIfUnsaved()) return
    onDateChange(todayRiyadh())
  }

  const handleModeSwitch = (mode: ViewMode) => {
    if (mode === viewMode) return
    if (!confirmIfUnsaved()) return
    onViewModeChange?.(mode)
  }

  const handleCustomDateChange = (newDate: string) => {
    if (!newDate) return
    if (!confirmIfUnsaved()) return
    onDateChange(newDate)
  }

  const handleOpenReport = () => {
    const reportUrl =
      viewMode === 'daily'
        ? `/report/daily?tanggal=${selectedDate}`
        : `/report/weekly?pekan=${currentPekanMulai}`
    window.open(reportUrl, '_blank')
  }

  const pekanInfo = useMemo(() => nomorPekanBulan(currentPekanMulai), [currentPekanMulai])

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* DESKTOP (lg and above): SINGLE CLEAN LINE */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex items-center justify-between h-16 gap-4">
          {/* LEFT: Menu Button + Page Title + Timezone */}
          <div className="flex items-center gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex items-center justify-center h-10 w-10 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none"
                title="Buka / Tutup Sidebar"
                aria-label="Toggle Sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold tracking-tight text-neutral-900 leading-tight">
                {pageTitle}
              </h1>
              <p className="text-[11px] font-medium text-neutral-400 leading-none mt-0.5">
                Waktu Saudi (UTC+3)
              </p>
            </div>
          </div>

          {/* CENTER: Context Controls (Mode Toggle + Navigator + Week Number) */}
          <div className="flex items-center justify-center gap-2.5">
            {/* View Mode Toggle: [Harian] [Pekanan] */}
            {onViewModeChange && (
              <div className="flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/70 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('daily')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'daily'
                      ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Harian
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('weekly')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'weekly'
                      ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Pekanan
                </button>
              </div>
            )}

            {/* Date Navigator Bar */}
            <div className="flex items-center gap-1 bg-neutral-100/80 p-0.5 rounded-lg border border-neutral-200/70 shadow-2xs">
              {/* Prev Button */}
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={handlePrev}
                title={viewMode === 'daily' ? 'Hari Sebelumnya' : 'Pekan Sebelumnya'}
                className="h-8 w-8 text-neutral-600 hover:text-neutral-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Today / This Week Button */}
              {(viewMode === 'daily' ? isCurrentToday : isCurrentThisWeek) ? (
                <span className="px-2 text-[11px] font-semibold text-neutral-400 select-none">
                  {viewMode === 'daily' ? 'Hari Ini' : 'Pekan Ini'}
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTodayOrThisWeek}
                  className="text-[11px] px-2 h-7 font-bold text-neutral-800 hover:bg-neutral-200/60"
                >
                  {viewMode === 'daily' ? 'Hari Ini' : 'Pekan Ini'}
                </Button>
              )}

              {/* Date / Calendar Label Input */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="sr-only"
                  id="header-date-input-desktop"
                />
                <label
                  htmlFor="header-date-input-desktop"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-200/60 rounded-md cursor-pointer transition-colors"
                  title="Pilih Tanggal Kalender"
                >
                  <Calendar className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                  <span className="truncate">
                    {viewMode === 'daily'
                      ? formatDateRiyadh(selectedDate)
                      : formatPekanDisplay(currentPekanMulai)}
                  </span>

                  {/* Weekend Badge in Daily mode */}
                  {viewMode === 'daily' && !isHariAktif(selectedDate) && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-700 border border-neutral-300">
                      Hari Libur
                    </span>
                  )}

                  {/* Incomplete Week Yellow Dot in Weekly mode */}
                  {viewMode === 'weekly' && isWeekIncomplete && (
                    <span
                      className="h-2 w-2 rounded-full bg-amber-500 shrink-0"
                      title="Data pekan ini belum terisi lengkap 5 hari aktif"
                    />
                  )}
                </label>
              </div>

              {/* Next Button */}
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={handleNext}
                title={viewMode === 'daily' ? 'Hari Berikutnya' : 'Pekan Berikutnya'}
                className="h-8 w-8 text-neutral-600 hover:text-neutral-900"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Week Number Badge */}
            <span className="px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-[11px] font-bold text-neutral-700">
              Pekan-{pekanInfo.nomor} {pekanInfo.namaBulan}
            </span>
          </div>

          {/* RIGHT: Print Report Button Only */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {!isConfigured && onOpenConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded bg-rose-50 border border-rose-200"
                title="Koneksi Supabase bermasalah"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                <span>Koneksi Offline</span>
              </button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenReport}
              className="text-xs font-semibold gap-1.5 border-neutral-200 hover:bg-neutral-50 text-neutral-800 shadow-2xs h-9 min-w-[44px]"
              title="Buka Laporan Siap Cetak / PDF"
            >
              <Printer className="h-3.5 w-3.5 text-neutral-700" />
              <span>Cetak Laporan</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE (under lg): TWO COMPACT ROWS */}
        {/* ========================================================================= */}
        <div className="flex flex-col py-2 gap-2 lg:hidden">
          {/* Mobile Row 1: [☰] Title ... [⎙] */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex items-center justify-center h-11 w-11 -ml-1.5 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none"
                aria-label="Buka Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-sm font-bold tracking-tight text-neutral-900 truncate">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-1">
              {!isConfigured && onOpenConfig && (
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className="p-2 text-rose-600"
                  title="Database belum terhubung"
                >
                  <AlertCircle className="h-5 w-5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenReport}
                className="flex items-center justify-center h-11 w-11 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none"
                title="Cetak Laporan"
                aria-label="Cetak Laporan"
              >
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Row 2: [Harian|Pekanan] ‹ Date Range › */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-neutral-100">
            {/* Mode Switcher */}
            {onViewModeChange && (
              <div className="flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/70 text-[11px] font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('daily')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'daily'
                      ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-500'
                  }`}
                >
                  Harian
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('weekly')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'weekly'
                      ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-500'
                  }`}
                >
                  Pekanan
                </button>
              </div>
            )}

            {/* Mobile Date Navigator */}
            <div className="flex items-center gap-0.5 bg-neutral-100/80 p-0.5 rounded-lg border border-neutral-200/60 shadow-2xs min-w-0">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center justify-center h-8 w-8 rounded text-neutral-600 hover:text-neutral-900"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="relative flex items-center px-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="sr-only"
                  id="header-date-input-mobile"
                />
                <label
                  htmlFor="header-date-input-mobile"
                  className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 truncate cursor-pointer py-1"
                >
                  <span className="truncate">
                    {viewMode === 'daily'
                      ? formatDateShortRiyadh(selectedDate)
                      : formatPekanMobile(currentPekanMulai)}
                  </span>
                  {viewMode === 'weekly' && isWeekIncomplete && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  )}
                </label>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center justify-center h-8 w-8 rounded text-neutral-600 hover:text-neutral-900"
                aria-label="Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
