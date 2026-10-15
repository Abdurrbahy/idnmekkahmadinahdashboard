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
    <div className="space-y-3">
      {/* Schedule Banner: Kamis */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-700 shrink-0" />
          <div>
            <span className="font-bold">Jadwal Laporan Hari Kamis:</span> Laporan disiapkan setiap hari Kamis. Hari Jumat & Sabtu yang belum berlangsung tidak dihitung sebagai ketidakhadiran atau data hilang.
          </div>
        </div>
        <div className="text-[11px] text-blue-700 font-semibold bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
          Waktu Asia/Riyadh (KSA)
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg md:text-xl font-extrabold text-neutral-900 tracking-tight">
              Weekly Report Koordinator
            </h1>
            {renderStatusBadge()}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Template laporan mingguan 10 bagian standar PDF IDN Mekkah & Madinah.
          </p>
        </div>

        {/* Week Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week Navigation */}
          <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50/80 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onWeekChange(prevPekan)}
              className="p-1.5 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 transition-colors"
              title="Pekan Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-neutral-800 whitespace-nowrap">
              {formatPekanDisplay(currentPekan)}
            </span>
            <button
              type="button"
              onClick={() => onWeekChange(nextPekan)}
              className="p-1.5 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 transition-colors"
              title="Pekan Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onValidate}
              className="text-xs font-semibold border-neutral-300 hover:bg-neutral-100"
            >
              Validasi Laporan
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewSlides}
              className="text-xs font-semibold border-neutral-300 text-sky-800 hover:bg-sky-50 gap-1.5"
            >
              <Presentation className="h-3.5 w-3.5" />
              Lihat Slide Koor
            </Button>

            {canEdit && (
              <Button
                type="button"
                onClick={onSave}
                disabled={saveState === 'saving'}
                className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5 h-8 px-3.5 shadow-2xs"
              >
                <Save className="h-3.5 w-3.5" />
                {saveState === 'saving' ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-save Status Line */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div>{renderSaveIndicator()}</div>
        <div className="text-[11px] text-neutral-400">
          Data operasional diambil otomatis berdasarkan pekan terpilih
        </div>
      </div>
    </div>
  )
}
