import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  Presentation,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { REPORT_SECTION_ORDER } from '@/types/weeklyReportTemplate'

interface ValidationModalProps {
  isOpen: boolean
  onClose: () => void
  isValid: boolean
  status: 'draft' | 'needs_review' | 'ready' | 'incomplete'
  issues: string[]
  completedCount: number
  onViewSlides: () => void
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  isValid,
  status,
  issues,
  completedCount,
  onViewSlides,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-neutral-800" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Validasi Kelengkapan Laporan Mingguan
              </h3>
              <p className="text-[11px] text-neutral-500">
                Pemeriksaan kepatuhan 10 bagian laporan sebelum diunduh / diserahkan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isValid ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {isValid
                    ? 'Laporan Siap Diunduh & Dipresentasikan'
                    : 'Sebagian Data Perlu Dilengkapi'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {completedCount} dari 10 bagian laporan telah terisi lengkap.
                </div>
              </div>
            </div>

            <Badge
              className={`text-xs font-bold ${
                isValid ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              {isValid ? 'Siap' : status === 'draft' ? 'Perlu Dilengkapi (Draft)' : 'Perlu Diperiksa'}
            </Badge>
          </div>

          {/* Issues List */}
          {issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Hal yang Perlu Diperiksa ({issues.length}):
              </h4>
              <div className="space-y-1.5">
                {issues.map((iss, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 flex items-start gap-2 text-xs"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{iss}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Overview Checklist */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Ikhtisar 10 Bagian Template:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {REPORT_SECTION_ORDER.map((sec) => (
                <div
                  key={sec.key}
                  className="p-2 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center justify-between"
                >
                  <span className="font-semibold text-neutral-700 truncate pr-1">
                    {sec.number}. {sec.title.split('(')[0]}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs border-neutral-300"
          >
            Tutup
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              onClose()
              onViewSlides()
            }}
            className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5"
          >
            <Presentation className="h-3.5 w-3.5" />
            Buka Slide Laporan
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
