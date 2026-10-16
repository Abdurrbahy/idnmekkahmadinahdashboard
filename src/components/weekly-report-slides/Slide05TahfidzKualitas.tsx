import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import type { Student, Submission } from '@/types/database'
import {
  calculateMajorityStatus,
  calculateScoreRange,
  getLatestZiyadah,
} from '@/lib/weeklyReportCalculator'

interface Slide05TahfidzKualitasProps {
  currentPekan?: string
  periodeFormatted: string
  students: Student[]
  submissions: Submission[]
  catatanPerkembangan?: Record<string | number, string>
  catatanPerhatian?: string
}

export const Slide05TahfidzKualitas: React.FC<Slide05TahfidzKualitasProps> = ({
  periodeFormatted,
  students,
  submissions,
  catatanPerkembangan = {},
  catatanPerhatian,
}) => {
  const activeStudents = students.filter((s) => s.status === 'aktif')

  return (
    <SlideFrame
      slideNumber={5}
      sectionCategory="KUALITAS TAHFIDZ"
      title="Kualitas Setoran & Perkembangan Hafalan"
      subtitle="Parameter mutu kelancaran, rentang nilai tajwid & makhraj, dan posisi surah ziyadah mutakhir."
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 flex flex-col justify-between gap-2.5 min-h-0">
        {/* Table: Kualitas & Perkembangan per Santri */}
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-white flex flex-col justify-between" style={{ borderColor: SLIDE_THEME.borderGrey }}>
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr
                  className="border-b font-bold text-[10px] uppercase tracking-wider"
                  style={{
                    backgroundColor: SLIDE_THEME.lightGrey,
                    borderColor: SLIDE_THEME.borderGrey,
                    color: SLIDE_THEME.textSecondary,
                  }}
                >
                  <th className="py-1.5 px-3 w-8 text-center">No</th>
                  <th className="py-1.5 px-3 w-40">Nama Santri</th>
                  <th className="py-1.5 px-3 text-center w-28">Status Mayoritas</th>
                  <th className="py-1.5 px-3 text-center w-24">Rentang Nilai</th>
                  <th className="py-1.5 px-3 w-36">Ziyadah Terakhir</th>
                  <th className="py-1.5 px-3">Catatan Perkembangan Individual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-neutral-400 italic">
                      Tidak ada data santri aktif.
                    </td>
                  </tr>
                ) : (
                  activeStudents.slice(0, 12).map((st, idx) => {
                    const stSubs = submissions.filter((s) => s.student_id === st.id)
                    const statusMayoritas = calculateMajorityStatus(stSubs)
                    const rentangNilai = calculateScoreRange(stSubs)
                    const latestZ = getLatestZiyadah(stSubs)
                    const personalNote = catatanPerkembangan[st.id] || ''

                    return (
                      <tr key={st.id} className="hover:bg-neutral-50/50">
                        <td className="py-1 px-3 text-center text-neutral-400 font-mono text-[10px]">
                          {idx + 1}
                        </td>
                        <td className="py-1 px-3 font-bold text-neutral-900 truncate">
                          {st.nama}
                        </td>
                        <td className="py-1 px-3 text-center">
                          {statusMayoritas === 'Lancar' ? (
                            <span
                              className="inline-block px-2 py-0.2 rounded text-[10px] font-extrabold uppercase"
                              style={{ backgroundColor: '#E6F4EA', color: '#137333' }}
                            >
                              Lancar
                            </span>
                          ) : statusMayoritas === 'Kurang' ? (
                            <span
                              className="inline-block px-2 py-0.2 rounded text-[10px] font-bold uppercase"
                              style={{ backgroundColor: '#FEF7E0', color: '#B06000' }}
                            >
                              Kurang
                            </span>
                          ) : statusMayoritas === 'Ulang' ? (
                            <span
                              className="inline-block px-2 py-0.2 rounded text-[10px] font-bold uppercase"
                              style={{ backgroundColor: '#FCE8E6', color: '#C5221F' }}
                            >
                              Ulang
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-medium bg-neutral-100 px-1.5 py-0.2 rounded">
                              {statusMayoritas}
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-3 text-center font-bold font-mono text-[10px]" style={{ color: SLIDE_THEME.primaryNavy }}>
                          {rentangNilai}
                        </td>
                        <td className="py-1 px-3 font-medium text-neutral-700 truncate text-[10px]">
                          {latestZ}
                        </td>
                        <td className="py-1 px-3 text-neutral-600 truncate text-[10px] italic">
                          {personalNote || 'Performa hafalan konsisten.'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Panel: Attention Point */}
        <div
          className="p-2 sm:p-2.5 rounded-lg border text-[11px] shrink-0"
          style={{
            backgroundColor: '#FFF8E1',
            borderColor: '#FFE082',
          }}
        >
          <span className="font-bold uppercase tracking-wider text-[10px] block" style={{ color: '#8D6E63' }}>
            Attention Point &amp; Rekomendasi Pendampingan:
          </span>
          <p className="text-[10px] sm:text-[11px] text-neutral-800 line-clamp-2 mt-0.5 leading-snug">
            {catatanPerhatian?.trim()
              ? catatanPerhatian
              : 'Fokus penguatan tajwid pada hukum Mad dan makharijul huruf bagi santri yang sedang menempuh juz baru.'}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}
