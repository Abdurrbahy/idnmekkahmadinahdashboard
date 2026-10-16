import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import type { Student, WeeklyMutabaah } from '@/types/database'

interface Slide03MutabaahProps {
  currentPekan: string
  periodeFormatted: string
  students: Student[]
  mutabaahList: WeeklyMutabaah[]
  mutabaahAvg: number | null
  catatanEvaluasi?: string
}

export const Slide03Mutabaah: React.FC<Slide03MutabaahProps> = ({
  periodeFormatted,
  students,
  mutabaahList,
  mutabaahAvg,
  catatanEvaluasi,
}) => {
  const activeStudents = students.filter((s) => s.status === 'aktif')

  return (
    <SlideFrame
      slideNumber={3}
      sectionCategory="KEDISIPLINAN & MUTABAAH"
      title="Kedisiplinan & Kepatuhan Mutabaah Yaumiyyah"
      subtitle="Monitoring kepatuhan ibadah harian (shalat berjamaah, rawatib, tahajjud, tilawah) per santri."
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 flex flex-col justify-between gap-2.5 min-h-0">
        {/* Top Summary Banner */}
        <div
          className="p-2 sm:p-2.5 rounded-lg border flex items-center justify-between text-xs shrink-0"
          style={{
            backgroundColor: SLIDE_THEME.lightGrey,
            borderColor: SLIDE_THEME.borderGrey,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold" style={{ color: SLIDE_THEME.textSecondary }}>
              Rata-rata Mutabaah Angkatan:
            </span>
            <span className="text-base sm:text-lg font-black" style={{ color: SLIDE_THEME.primaryNavy }}>
              {mutabaahAvg !== null ? `${mutabaahAvg}%` : 'Data belum tersedia'}
            </span>
          </div>

          <div className="text-[10px] sm:text-[11px] font-medium" style={{ color: SLIDE_THEME.textSecondary }}>
            Standar KBM Aktif: <strong className="text-neutral-800">5 Hari (Ahad–Kamis)</strong> • Terdaftar:{' '}
            <strong className="text-neutral-800">{activeStudents.length} Santri</strong>
          </div>
        </div>

        {/* Structured 2-Column Grid Table for 12 Students */}
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
                  <th className="py-1.5 px-3 w-10 text-center">No</th>
                  <th className="py-1.5 px-3">Nama Santri</th>
                  <th className="py-1.5 px-3 text-center w-28">Hari Terisi</th>
                  <th className="py-1.5 px-3 text-center w-28">Rata-rata Skor</th>
                  <th className="py-1.5 px-3 text-center w-36">Status Konsistensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-neutral-400 italic">
                      Tidak ada data santri aktif.
                    </td>
                  </tr>
                ) : (
                  activeStudents.slice(0, 12).map((st, idx) => {
                    const m = mutabaahList.find((item) => item.student_id === st.id)
                    const hariTerisi = m?.hari_terisi ?? 0
                    const skor = m?.rata_skor_mutabaah ?? null

                    return (
                      <tr key={st.id} className="hover:bg-neutral-50/50">
                        <td className="py-1 px-3 text-center text-neutral-400 font-mono text-[10px]">
                          {idx + 1}
                        </td>
                        <td className="py-1 px-3 font-bold text-neutral-900 truncate">
                          {st.nama}
                        </td>
                        <td className="py-1 px-3 text-center text-neutral-600 font-mono text-[10px]">
                          {m ? `${hariTerisi} / 5 hari` : '0 / 5 hari'}
                        </td>
                        <td className="py-1 px-3 text-center font-black font-mono text-[11px]" style={{ color: SLIDE_THEME.primaryNavy }}>
                          {skor !== null ? `${skor}%` : '—'}
                        </td>
                        <td className="py-1 px-3 text-center">
                          {skor === null ? (
                            <span className="text-[10px] text-neutral-400 italic">Belum ada data</span>
                          ) : skor >= 85 ? (
                            <span
                              className="inline-block px-2 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wide"
                              style={{ backgroundColor: '#E6F4EA', color: '#137333' }}
                            >
                              Sangat Baik
                            </span>
                          ) : skor >= 70 ? (
                            <span
                              className="inline-block px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wide"
                              style={{ backgroundColor: '#FEF7E0', color: '#B06000' }}
                            >
                              Cukup
                            </span>
                          ) : (
                            <span
                              className="inline-block px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wide"
                              style={{ backgroundColor: '#FCE8E6', color: '#C5221F' }}
                            >
                              Perlu Perhatian
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Panel: Catatan Evaluasi Koordinator */}
        <div
          className="p-2 sm:p-2.5 rounded-lg border text-[11px] shrink-0"
          style={{
            backgroundColor: SLIDE_THEME.lightBlue,
            borderColor: SLIDE_THEME.borderGrey,
          }}
        >
          <span className="font-bold uppercase tracking-wider text-[10px] block" style={{ color: SLIDE_THEME.primaryNavy }}>
            Catatan Evaluasi Kedisiplinan &amp; Yaumiyyah:
          </span>
          <p className="text-[10px] sm:text-[11px] text-neutral-800 line-clamp-2 mt-0.5 leading-snug">
            {catatanEvaluasi?.trim()
              ? catatanEvaluasi
              : 'Alhamdulillah, pembiasaan ibadah harian santri terpantau tertib dengan bimbingan musyrif asrama.'}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}
