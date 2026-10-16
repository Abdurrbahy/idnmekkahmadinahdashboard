import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  AlertTriangle,
  Presentation,
  Clock,
  Calendar,
  Menu,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  formatPekanDisplay,
  addDaysToDate,
  formatUpdatedTime,
} from '@/lib/dateUtils'

interface WeeklyReportHeaderProps {
  currentPekan: string
  onWeekChange: (newPekan: string) => void
  status: 'draft' | 'needs_review' | 'ready' | 'incomplete'
  saveState: 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
  lastSavedAt?: string
  canEdit: boolean
  onSave: () => void
  onValidate: () => void
  onViewSlides: () => void
  onToggleSidebar?: () => void
}

export const WeeklyReportHeader: React.FC<WeeklyReportHeaderProps> = ({
  currentPekan,
  onWeekChange,
  status,
  saveState,
  lastSavedAt,
  canEdit,
  onSave,
  onValidate,
  onViewSlides,
  onToggleSidebar,
}) => {
  const prevPekan = addDaysToDate(currentPekan, -7)
  const nextPekan = addDaysToDate(currentPekan, 7)

  const renderStatusBadge = () => {
    switch (status) {
      case 'ready':
        return (
          <Badge className="bg-emerald-600 text-white border-transparent text-xs font-semibold px-2.5 py-1 gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Siap Diunduh
          </Badge>
        )
      case 'needs_review':
        return (
          <Badge className="bg-amber-500 text-white border-transparent text-xs font-semibold px-2.5 py-1 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Perlu Diperiksa
          </Badge>
        )
      case 'incomplete':
        return (
          <Badge className="bg-rose-600 text-white border-transparent text-xs font-semibold px-2.5 py-1 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Data Belum Lengkap
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-neutral-700 bg-neutral-100 border-neutral-300 text-xs font-semibold px-2.5 py-1">
            Draft
          </Badge>
        )
    }
  }

  const renderSaveIndicator = () => {
    if (saveState === 'saving') {
      return (
        <span className="text-xs text-neutral-500 flex items-center gap-1.5 animate-pulse">
          <Clock className="h-3.5 w-3.5" />
          Menyimpan perubahan...
        </span>
      )
    }
    if (saveState === 'unsaved') {
      return (
        <span className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          Perubahan belum disimpan
        </span>
      )
    }
    if (saveState === 'saved') {
      return (
        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {lastSavedAt ? `Tersimpan (${formatUpdatedTime(lastSavedAt)})` : 'Tersimpan'}
        </span>
      )
    }
    if (saveState === 'error') {
      return (
        <span className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Gagal menyimpan
        </span>
      )
    }
    return (
      <span className="text-xs text-neutral-400">
        {lastSavedAt ? `Terakhir disimpan ${lastSavedAt}` : 'Belum ada perubahan'}
      </span>
    )
  }

  return (
    <div className="space-y-3 w-full">
      {/* Schedule Banner: Kamis */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
          <Calendar className="h-4 w-4 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs leading-relaxed text-blue-900">
            <span className="font-bold">Jadwal Laporan Hari Kamis:</span> Laporan disiapkan setiap hari Kamis. Hari Jumat &amp; Sabtu yang belum berlangsung tidak dihitung sebagai ketidakhadiran atau data hilang.
          </p>
        </div>
        <div className="text-[11px] text-blue-700 font-semibold bg-white/90 px-2.5 py-1 rounded-md border border-blue-200 self-start sm:self-auto shrink-0 whitespace-nowrap">
          Waktu Asia/Riyadh (KSA)
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3.5 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-2xs">
        {/* Title + Status + Mobile Menu Button */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex items-center justify-center h-8 w-8 -ml-1 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none lg:hidden shrink-0"
                aria-label="Buka Menu Sidebar"
                title="Buka Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-neutral-900 tracking-tight">
              Weekly Report Koordinator
            </h1>
            <div className="shrink-0">{renderStatusBadge()}</div>
          </div>
          <p className="text-xs text-neutral-500 mt-1 leading-snug">
            Template laporan mingguan 10 bagian standar PDF IDN Mekkah &amp; Madinah.
          </p>
        </div>

        {/* Week Selector & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full xl:w-auto">
          {/* Week Navigation */}
          <div className="flex items-center justify-between sm:justify-start rounded-xl border border-neutral-200 bg-neutral-50/80 p-0.5 shadow-2xs w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onWeekChange(prevPekan)}
              className="p-1.5 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 transition-colors shrink-0"
              title="Pekan Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2.5 text-xs font-bold text-neutral-800 whitespace-nowrap text-center flex-1 sm:flex-none">
              {formatPekanDisplay(currentPekan)}
            </span>
            <button
              type="button"
              onClick={() => onWeekChange(nextPekan)}
              className="p-1.5 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 transition-colors shrink-0"
              title="Pekan Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onValidate}
              className="text-xs font-semibold border-neutral-300 hover:bg-neutral-100 flex-1 sm:flex-none justify-center h-8.5 gap-1.5 px-3"
            >
              <FileCheck className="h-3.5 w-3.5 text-neutral-600" />
              <span>Validasi</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewSlides}
              className="text-xs font-semibold border-neutral-300 text-sky-800 hover:bg-sky-50 flex-1 sm:flex-none justify-center h-8.5 gap-1.5 px-3"
            >
              <Presentation className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lihat Slide Koor</span>
              <span className="sm:hidden">Slide</span>
            </Button>

            {canEdit && (
              <Button
                type="button"
                onClick={onSave}
                disabled={saveState === 'saving'}
                className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5 h-8.5 px-4 shadow-2xs w-full sm:w-auto justify-center"
              >
                <Save className="h-3.5 w-3.5" />
                {saveState === 'saving' ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-save Status Line */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 px-1 sm:px-2 text-xs">
        <div>{renderSaveIndicator()}</div>
        <div className="text-[11px] text-neutral-400">
          Data operasional diambil otomatis berdasarkan pekan terpilih
        </div>
      </div>
    </div>
  )
}
