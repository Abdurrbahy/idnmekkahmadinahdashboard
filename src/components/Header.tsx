import React from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Eye,
  HeartHandshake,
  Clock,
  AlertCircle,
  Printer,
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useAuth } from '@/context/AuthContext'
import {
  todayRiyadh,
  formatDateRiyadh,
  addDaysToDate,
  pekanMulai,
  formatPekanDisplay,
} from '@/lib/dateUtils'

export type ViewMode = 'daily' | 'weekly'

interface HeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  selectedDate: string
  onDateChange: (date: string) => void
  isConfigured: boolean
  onOpenConfig: () => void
  hasUnsavedChanges?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  selectedDate,
  onDateChange,
  isConfigured,
  onOpenConfig,
  hasUnsavedChanges = false,
}) => {
  const { profile, isActive, signOut } = useAuth()

  const currentPekanMulai = pekanMulai(selectedDate)
  const isCurrentToday = selectedDate === todayRiyadh()
  const isCurrentThisWeek = currentPekanMulai === pekanMulai(todayRiyadh())

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
    onViewModeChange(mode)
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

  const userRole = profile?.role || 'walsan'
  const userFullName = profile?.nama || profile?.email?.split('@')[0] || 'Pengguna'

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2.5 py-2.5 sm:py-3 md:flex-row md:items-center md:justify-between">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white font-bold tracking-wider text-xs shadow-xs">
                IDN
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 leading-none">
                    IDN Boarding School
                  </h1>
                  <Badge variant="outline" className="hidden sm:inline-flex border-neutral-200 text-neutral-600 bg-neutral-50 text-[10px] py-0">
                    Mekkah & Madinah
                  </Badge>
                </div>
                <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                  Waktu Saudi (Asia/Riyadh, UTC+3)
                </p>
              </div>
            </div>

            {/* Mobile Profile & Print Buttons */}
            <div className="flex items-center gap-1.5 md:hidden">
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={handleOpenReport}
                className="text-neutral-600 hover:text-neutral-900"
                title="Cetak Laporan (PDF)"
              >
                <Printer className="h-4 w-4" />
              </Button>
              {!isConfigured && (
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className="p-1 text-rose-600"
                  title="Database belum terhubung"
                >
                  <AlertCircle className="h-4 w-4" />
                </button>
              )}
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={() => signOut()}
                className="text-neutral-500 hover:text-rose-600"
                title="Keluar (Sign Out)"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Center: Mode Toggle & Date Navigator */}
          <div className="flex flex-wrap items-center justify-center gap-2 self-center md:self-auto">
            {/* View Mode Toggle: [Harian] [Pekanan] */}
            <div className="flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleModeSwitch('daily')}
                className={`px-2.5 py-1 rounded-md transition-all ${
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
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Pekanan
              </button>
            </div>

            {/* Date / Week Navigator */}
            <div className="flex items-center gap-1 bg-neutral-100/80 p-0.5 rounded-lg border border-neutral-200/60 shadow-2xs">
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={handlePrev}
                title={viewMode === 'daily' ? 'Hari Sebelumnya' : 'Pekan Sebelumnya'}
                className="h-7 w-7 text-neutral-600 hover:text-neutral-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant={
                  (viewMode === 'daily' && isCurrentToday) || (viewMode === 'weekly' && isCurrentThisWeek)
                    ? 'default'
                    : 'ghost'
                }
                size="sm"
                onClick={handleTodayOrThisWeek}
                className={`text-[11px] px-2 h-7 font-medium ${
                  (viewMode === 'daily' && isCurrentToday) || (viewMode === 'weekly' && isCurrentThisWeek)
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-700'
                }`}
              >
                {viewMode === 'daily' ? 'Hari Ini' : 'Pekan Ini'}
              </Button>

              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="sr-only"
                  id="header-date-input"
                />
                <label
                  htmlFor="header-date-input"
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-200/60 rounded-md cursor-pointer transition-colors"
                  title="Pilih Tanggal Kalender"
                >
                  <Calendar className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                  <span className="truncate max-w-[180px] sm:max-w-none">
                    {viewMode === 'daily'
                      ? formatDateRiyadh(selectedDate)
                      : formatPekanDisplay(currentPekanMulai)}
                  </span>
                </label>
              </div>

              <Button
                variant="ghost"
                size="xsIcon"
                onClick={handleNext}
                title={viewMode === 'daily' ? 'Hari Berikutnya' : 'Pekan Berikutnya'}
                className="h-7 w-7 text-neutral-600 hover:text-neutral-900"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right: Desktop Actions & User Profile */}
          <div className="hidden md:flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenReport}
              className="text-xs font-semibold gap-1.5 border-neutral-200 hover:bg-neutral-50 text-neutral-700"
              title="Buka Laporan Siap Cetak / PDF di Tab Baru"
            >
              <Printer className="h-3.5 w-3.5 text-neutral-700" />
              <span>Cetak Laporan</span>
            </Button>
            {!isConfigured && (
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

            {/* Role Badge */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-200">
              {profile ? (
                !isActive ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="h-3 w-3" />
                    Pending
                  </span>
                ) : userRole === 'admin' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                ) : userRole === 'atasan' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    <Eye className="h-3 w-3" />
                    Atasan
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                    <HeartHandshake className="h-3 w-3" />
                    Walsan
                  </span>
                )
              ) : null}

              <div className="flex flex-col text-left text-xs font-semibold text-neutral-800">
                <span className="truncate max-w-[130px]">{userFullName}</span>
              </div>

              <Button
                variant="ghost"
                size="xsIcon"
                onClick={() => signOut()}
                className="text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                title="Keluar (Sign Out)"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
