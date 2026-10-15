import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus } from 'lucide-react'
import type { Student, WeeklyQuran } from '@/types/database'

interface SectionQuranProps {
  students: Student[]
  quranList: WeeklyQuran[]
  totalZiyadah: number
  totalMurajaah: number
  totalAyat: number
  catatanEvaluasi: string
  onCatatanChange: (catatan: string) => void
  readOnly?: boolean
}

export const SectionQuran: React.FC<SectionQuranProps> = ({
  students,
  quranList,
  totalZiyadah,
  totalMurajaah,
  totalAyat,
  catatanEvaluasi,
  onCatatanChange,
  readOnly = false,
}) => {
  const handleInsertSummary = () => {
    if (readOnly) return
    const draftText = `Total capaian hafalan santri pekan ini terakumulasi sebanyak ${totalAyat} ayat (${totalZiyadah} ayat Ziyadah & ${totalMurajaah} ayat Muraja'ah). Distribusi setoran berjalan stabil dan merata pada seluruh santri.`
    if (catatanEvaluasi.trim()) {
      onCatatanChange(`${catatanEvaluasi}\n\n${draftText}`)
    } else {
      onCatatanChange(draftText)
    }
  }

  const activeStudents = students.filter((s) => s.status === 'aktif')

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-neutral-800" />
          <div>
            <CardTitle className="text-base font-bold text-neutral-900">
              Bagian 4 — Capaian Setoran Al-Qur'an
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Akumulasi setoran ayat Ziyadah (hafalan baru) dan Muraja'ah santri selama satu pekan.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Ringkasan Akumulasi Total Ayat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Total Ziyadah (Ayat Baru)
            </span>
            <div className="text-xl font-black text-emerald-950 mt-1">
              {totalZiyadah} <span className="text-xs font-medium text-emerald-700">ayat</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
              Total Muraja'ah
            </span>
            <div className="text-xl font-black text-sky-950 mt-1">
              {totalMurajaah} <span className="text-xs font-medium text-sky-700">ayat</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900 text-white shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Total Keseluruhan
            </span>
            <div className="text-xl font-black text-white mt-1">
              {totalAyat} <span className="text-xs font-medium text-neutral-400">ayat</span>
            </div>
          </div>
        </div>

        {/* Tabel Capaian Per Santri */}
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">Nama Santri</th>
                  <th className="py-2.5 px-4 text-center">Ziyadah (Ayat)</th>
                  <th className="py-2.5 px-4 text-center">Muraja'ah (Ayat)</th>
                  <th className="py-2.5 px-4 text-center">Total Ayat</th>
                  <th className="py-2.5 px-4 text-center">Sesi Setoran</th>
                  <th className="py-2.5 px-4 text-center">Status Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/70">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      Tidak ada santri aktif.
                    </td>
                  </tr>
                ) : (
                  activeStudents.map((st, idx) => {
                    const qRecord = quranList.find((q) => q.student_id === st.id)
                    const z = qRecord?.total_ziyadah_ayat || 0
                    const m = qRecord?.total_murajaah_ayat || 0
                    const total = z + m
                    const sesi = qRecord?.jumlah_setoran || 0

                    return (
                      <tr key={st.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-center text-neutral-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-neutral-900">
                          {st.nama}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                          {z}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-sky-700">
                          {m}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-neutral-900">
                          {total}
                        </td>
                        <td className="py-2.5 px-4 text-center text-neutral-700 font-medium">
                          {sesi} sesi
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {total > 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                              Lengkap
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">0 Ayat</span>
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

        {/* Catatan Evaluasi Capaian Qur'an Pekan Ini */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-neutral-800 block">
              Catatan Evaluasi Capaian Al-Qur'an Pekan Ini
            </label>
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleInsertSummary}
                className="text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-50 h-7 px-2 font-semibold gap-1"
              >
                <Plus className="h-3 w-3" />
                Sisipkan ringkasan ke catatan
              </Button>
            )}
          </div>
          <Textarea
            value={catatanEvaluasi}
            onChange={(e) => onCatatanChange(e.target.value)}
            disabled={readOnly}
            placeholder="Contoh: Capaian hafalan pekan ini berjalan sangat baik. Seluruh santri mampu menyelesaikan target ziyadah juz masing-masing dan muraja'ah..."
            rows={3}
            className="text-xs"
          />
        </div>
      </CardContent>
    </Card>
  )
}
