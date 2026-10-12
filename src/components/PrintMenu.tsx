import React, { useState, useRef, useEffect } from 'react'
import { Printer, Presentation, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from '@/context/AuthContext'
import { pekanMulai, formatDateShortRiyadh } from '@/lib/dateUtils'
import { nomorPekanBulan } from '@/lib/printUtils'
import type { Student } from '@/types/database'

interface PrintMenuProps {
  selectedDate: string
  students: Student[]
  triggerMode?: 'desktop' | 'mobile'
}

export const PrintMenu: React.FC<PrintMenuProps> = ({
  selectedDate,
  students,
  triggerMode = 'desktop',
}) => {
  const { profile } = useAuth()
  const userRole = profile?.role || 'walsan'
  const isStaff = userRole === 'admin' || userRole === 'atasan'

  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentPekanMulai = pekanMulai(selectedDate)
  const pekanInfo = nomorPekanBulan(currentPekanMulai)

  // Default selected student for staff, or locked student for walsan
  const defaultStudentId = students[0]?.id ? String(students[0].id) : ''
  const [weeklyStudentId, setWeeklyStudentId] = useState<string>(defaultStudentId)
  const [batchStudentId, setBatchStudentId] = useState<string>(defaultStudentId)

  // Sync state if students list updates
  useEffect(() => {
    if (students.length > 0) {
      if (!weeklyStudentId) setWeeklyStudentId(String(students[0].id))
      if (!batchStudentId) setBatchStudentId(String(students[0].id))
    }
  }, [students, weeklyStudentId, batchStudentId])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const openRoute = (url: string) => {
    window.open(url, '_blank')
    setIsOpen(false)
  }

  // Active student for walsan is always their own child
  const effectiveWeeklyStudentId = isStaff ? weeklyStudentId : defaultStudentId
  const effectiveBatchStudentId = isStaff ? batchStudentId : defaultStudentId

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* TRIGGER BUTTON */}
      {triggerMode === 'desktop' ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs font-semibold gap-1.5 border-neutral-200 hover:bg-neutral-50 text-neutral-800 shadow-2xs h-9 min-h-[44px] min-w-[44px]"
          title="Buka Menu Cetak & Unduh"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Printer className="h-3.5 w-3.5 text-neutral-700" />
          <span>Cetak & Unduh</span>
          <ChevronDown className={`h-3 w-3 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center justify-center h-11 w-11 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none"
          title="Cetak & Unduh"
          aria-label="Cetak & Unduh"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Printer className="h-5 w-5" />
        </button>
      )}

      {/* POPOVER MENU */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[calc(100vw-24px)] rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xl z-50 text-neutral-900 select-none animate-in fade-in-50 zoom-in-95">
          {/* Header Periode */}
          <div className="pb-2.5 border-b border-neutral-100">
            <div className="text-xs font-bold text-neutral-900">Cetak & Unduh</div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
              Periode: {pekanInfo.labelPekan}
            </div>
          </div>

          <div className="space-y-3 pt-2.5">
            {/* GROUP 1: LAPORAN PEKANAN */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                Laporan Pekanan
              </div>

              {/* Semua Santri (Staff Only) */}
              {isStaff && (
                <div className="flex items-center justify-between py-1 text-xs">
                  <span className="text-neutral-700 font-medium">Semua santri</span>
                  <button
                    type="button"
                    onClick={() => openRoute(`/report/weekly?pekan=${currentPekanMulai}`)}
                    className="flex items-center justify-center h-9 w-9 min-h-[44px] min-w-[44px] rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
                    title="Cetak Laporan Pekanan Semua Santri"
                    aria-label="Cetak Laporan Pekanan Semua Santri"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Per Santri */}
              <div className="flex items-center justify-between gap-2 py-1 text-xs">
                <span className="text-neutral-700 font-medium shrink-0">Per santri</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <select
                    value={effectiveWeeklyStudentId}
                    disabled={!isStaff}
                    onChange={(e) => setWeeklyStudentId(e.target.value)}
                    className={`h-9 min-h-[44px] rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-xs font-medium text-neutral-800 focus:outline-none truncate max-w-[170px] ${
                      !isStaff ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:bg-neutral-100'
                    }`}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (effectiveWeeklyStudentId) {
                        openRoute(`/report/weekly?pekan=${currentPekanMulai}&santri=${effectiveWeeklyStudentId}`)
                      }
                    }}
                    className="flex items-center justify-center h-9 w-9 min-h-[44px] min-w-[44px] rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
                    title="Cetak Laporan Pekanan Santri"
                    aria-label="Cetak Laporan Pekanan Santri"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* GROUP 2: ARSIP HARIAN SEPEKAN (5 Hari) */}
            <div className="space-y-1.5 pt-1 border-t border-neutral-100">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                Arsip Harian Sepekan (5 hari)
              </div>

              {/* Per Santri */}
              <div className="flex items-center justify-between gap-2 py-1 text-xs">
                <span className="text-neutral-700 font-medium shrink-0">Per santri</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <select
                    value={effectiveBatchStudentId}
                    disabled={!isStaff}
                    onChange={(e) => setBatchStudentId(e.target.value)}
                    className={`h-9 min-h-[44px] rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-xs font-medium text-neutral-800 focus:outline-none truncate max-w-[170px] ${
                      !isStaff ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:bg-neutral-100'
                    }`}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (effectiveBatchStudentId) {
                        openRoute(`/report/daily-batch?pekan=${currentPekanMulai}&santri=${effectiveBatchStudentId}`)
                      }
                    }}
                    className="flex items-center justify-center h-9 w-9 min-h-[44px] min-w-[44px] rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
                    title="Cetak Arsip Harian Sepekan Santri"
                    aria-label="Cetak Arsip Harian Sepekan Santri"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* GROUP 3: LAPORAN HARIAN */}
            <div className="space-y-1.5 pt-1 border-t border-neutral-100">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                Laporan Harian
              </div>

              {/* Hari ini saja */}
              <div className="flex items-center justify-between py-1 text-xs">
                <div>
                  <span className="text-neutral-700 font-medium">Hari ini saja</span>
                  <span className="text-[10px] text-neutral-400 block font-normal">
                    {formatDateShortRiyadh(selectedDate)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openRoute(`/report/daily?tanggal=${selectedDate}`)}
                  className="flex items-center justify-center h-9 w-9 min-h-[44px] min-w-[44px] rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
                  title="Cetak Laporan Harian Terpilih"
                  aria-label="Cetak Laporan Harian Terpilih"
                >
                  <Printer className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* GROUP 4: SLIDE ATASAN 16:9 (Admin & Atasan Only) */}
            {isStaff && (
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between py-1 text-xs">
                  <div>
                    <span className="text-neutral-800 font-semibold">Slide Atasan 16:9</span>
                    <span className="text-[10px] text-neutral-400 block font-normal">
                      Format Presentasi Rapat Yayasan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openRoute(`/report/weekly-progress?pekan=${currentPekanMulai}`)}
                    className="flex items-center justify-center h-9 w-9 min-h-[44px] min-w-[44px] rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
                    title="Buka Slide Presentasi 16:9"
                    aria-label="Buka Slide Presentasi 16:9"
                  >
                    <Presentation className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
