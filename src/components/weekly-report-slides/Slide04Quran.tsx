import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import type { Student, WeeklyQuran } from '@/types/database'

interface Slide04QuranProps {
  currentPekan: string
  periodeFormatted: string
  students: Student[]
  quranList: WeeklyQuran[]
  totalZiyadah: number
  totalMurajaah: number
  totalAyat: number
  catatanEvaluasi?: string
}

export const Slide04Quran: React.FC<Slide04QuranProps> = ({
  periodeFormatted,
  students,
  quranList,
  totalZiyadah,
  totalMurajaah,
  totalAyat,
  catatanEvaluasi,
}) => {
  const activeStudents = students.filter((s) => s.status === 'aktif')

  return (
    <SlideFrame
      slideNumber={4}
      sectionCategory="CAPAIAN AL-QUR'AN"
      title="Capaian Akumulasi Setoran Tahfidz Al-Qur'an"
      subtitle="Rekapitulasi volume setoran hafalan baru (Ziyadah) dan pengulangan (Muraja'ah) seluruh santri."
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 flex flex-col justify-between gap-2.5 min-h-0">
        {/* Top 3 Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
          <div
            className="p-2 sm:p-2.5 rounded-lg border flex items-center justify-between"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SLIDE_THEME.textSecondary }}>
                Total Ziyadah (Ayat Baru)
              </span>
              <div className="text-lg sm:text-xl font-black mt-0.5" style={{ color: SLIDE_THEME.primaryNavy }}>
                {totalZiyadah.toLocaleString('id-ID')}{' '}
                <span className="text-[11px] font-semibold text-neutral-500">ayat</span>
              </div>
            </div>
          </div>

          <div
            className="p-2 sm:p-2.5 rounded-lg border flex items-center justify-between"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SLIDE_THEME.textSecondary }}>
                Total Muraja'ah (Pengulangan)
              </span>
              <div className="text-lg sm:text-xl font-black mt-0.5" style={{ color: SLIDE_THEME.secondaryBlue }}>
                {totalMurajaah.toLocaleString('id-ID')}{' '}
                <span className="text-[11px] font-semibold text-neutral-500">ayat</span>
              </div>
            </div>
          </div>

          <div
            className="p-2 sm:p-2.5 rounded-lg border flex items-center justify-between text-white"
            style={{
              backgroundColor: SLIDE_THEME.primaryNavy,
              borderColor: SLIDE_THEME.primaryNavy,
            }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                Total Keseluruhan Ayat
              </span>
              <div className="text-lg sm:text-xl font-black mt-0.5 text-white">
                {totalAyat.toLocaleString('id-ID')}{' '}
                <span className="text-[11px] font-semibold text-blue-200">ayat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Table for all 12 Students */}
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
                  <th className="py-1.5 px-3 text-center w-28">Ziyadah (Ayat)</th>
                  <th className="py-1.5 px-3 text-center w-28">Muraja'ah (Ayat)</th>
                  <th className="py-1.5 px-3 text-center w-32">Total Ayat</th>
                  <th className="py-1.5 px-3 text-center w-28">Sesi Setoran</th>
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
                    const q = quranList.find((item) => item.student_id === st.id)
                    const z = q?.total_ziyadah_ayat || 0
                    const m = q?.total_murajaah_ayat || 0
                    const tot = z + m
                    const sesi = q?.jumlah_setoran || 0

                    return (
                      <tr key={st.id} className="hover:bg-neutral-50/50">
                        <td className="py-1 px-3 text-center text-neutral-400 font-mono text-[10px]">
                          {idx + 1}
                        </td>
                        <td className="py-1 px-3 font-bold text-neutral-900 truncate">
                          {st.nama}
                        </td>
                        <td className="py-1 px-3 text-center font-mono font-bold text-[11px]" style={{ color: SLIDE_THEME.primaryNavy }}>
                          {z > 0 ? z.toLocaleString('id-ID') : '—'}
                        </td>
                        <td className="py-1 px-3 text-center font-mono font-bold text-[11px]" style={{ color: SLIDE_THEME.secondaryBlue }}>
                          {m > 0 ? m.toLocaleString('id-ID') : '—'}
                        </td>
                        <td className="py-1 px-3 text-center font-mono font-black text-[11px] text-neutral-900">
                          {tot > 0 ? tot.toLocaleString('id-ID') : '—'}
                        </td>
                        <td className="py-1 px-3 text-center text-neutral-600 font-mono text-[10px]">
                          {sesi > 0 ? `${sesi} kali` : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Panel: Catatan Evaluasi Tahfidz */}
        <div
          className="p-2 sm:p-2.5 rounded-lg border text-[11px] shrink-0"
          style={{
            backgroundColor: SLIDE_THEME.lightBlue,
            borderColor: SLIDE_THEME.borderGrey,
          }}
        >
          <span className="font-bold uppercase tracking-wider text-[10px] block" style={{ color: SLIDE_THEME.primaryNavy }}>
            Catatan Evaluasi Tahfidz Pekanan:
          </span>
          <p className="text-[10px] sm:text-[11px] text-neutral-800 line-clamp-2 mt-0.5 leading-snug">
            {catatanEvaluasi?.trim()
              ? catatanEvaluasi
              : 'Target ziyadah hafalan baru dan pemantapan muraja\'ah tercapai sesuai kurikulum tahfidz pekan ini.'}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}
