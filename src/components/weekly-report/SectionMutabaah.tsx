import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Plus } from 'lucide-react'
import type { Student, WeeklyMutabaah } from '@/types/database'

interface SectionMutabaahProps {
  students: Student[]
  mutabaahList: WeeklyMutabaah[]
  mutabaahAvg: number | null
  catatanEvaluasi: string
  onCatatanChange: (catatan: string) => void
  readOnly?: boolean
}

export const SectionMutabaah: React.FC<SectionMutabaahProps> = ({
  students,
  mutabaahList,
  mutabaahAvg,
  catatanEvaluasi,
  onCatatanChange,
  readOnly = false,
}) => {
  const handleInsertSummary = () => {
    if (readOnly) return
    const avgText = mutabaahAvg !== null ? `${mutabaahAvg}%` : '—'
    const draftText = `Konsistensi mutabaah ibadah yaumiyyah santri pekan ini berada pada rata-rata ${avgText}. Sebagian besar santri aktif menjaga shalat berjamaah dan tilawah harian.`
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
          <Sparkles className="h-5 w-5 text-neutral-800" />
          <div>
            <CardTitle className="text-base font-bold text-neutral-900">
              Bagian 3 — Mutabaah & Kedisiplinan Santri
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Data kepatuhan amalan yaumiyyah santri (shalat 5 waktu, tahajjud, rawatib, tilawah) per pekan.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-5 space-y-4 sm:space-y-5">
        {/* Rata-rata Header Card */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs text-neutral-500 font-medium">Rata-rata Skor Mutabaah Santri:</span>
            <span className="ml-2 text-base font-black text-neutral-900">
              {mutabaahAvg !== null ? `${mutabaahAvg}%` : 'Belum ada data yang cukup'}
            </span>
          </div>
          <Badge variant="outline" className="text-xs font-semibold bg-white self-start sm:self-auto">
            {activeStudents.length} Santri Aktif
          </Badge>
        </div>

        {/* Tabel Capaian Mutabaah Per Santri */}
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs text-left min-w-[500px]">
              <thead className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">Nama Santri</th>
                  <th className="py-2.5 px-4 text-center">Hari Terisi (KBM)</th>
                  <th className="py-2.5 px-4 text-center">Rata-rata Skor</th>
                  <th className="py-2.5 px-4 text-center">Status Konsistensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/70">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-400">
                      Tidak ada santri aktif.
                    </td>
                  </tr>
                ) : (
                  activeStudents.map((st, idx) => {
                    const mRecord = mutabaahList.find((m) => m.student_id === st.id)
                    const hariTerisi = mRecord?.hari_terisi || 0
                    const skor = mRecord ? mRecord.rata_skor_mutabaah : null

                    return (
                      <tr key={st.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-center text-neutral-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-neutral-900">
                          {st.nama}
                        </td>
                        <td className="py-2.5 px-4 text-center text-neutral-700 font-medium">
                          {hariTerisi} / 5 hari
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-neutral-900 font-mono">
                          {skor !== null && skor !== undefined ? `${skor}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {skor === null ? (
                            <span className="text-[11px] text-neutral-400 italic">Belum ada data</span>
                          ) : skor >= 85 ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                              Sangat Baik
                            </Badge>
                          ) : skor >= 70 ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                              Cukup
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                              Perlu Perhatian
                            </Badge>
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

        {/* Catatan Evaluasi Kedisiplinan Pekan Ini */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-neutral-800 block">
              Catatan Evaluasi Kedisiplinan & Mutabaah Pekan Ini
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
            placeholder="Contoh: Konsistensi mutabaah pekan ini berada pada rentang 80–95%. Kedisiplinan shalat subuh berjamaah dan tilawah pagi terpantau sangat baik..."
            rows={3}
            className="text-xs"
          />
        </div>
      </CardContent>
    </Card>
  )
}
