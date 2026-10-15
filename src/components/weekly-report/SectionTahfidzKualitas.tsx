import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, AlertTriangle, Plus } from 'lucide-react'
import type { Student, Submission } from '@/types/database'
import {
  calculateMajorityStatus,
  calculateScoreRange,
  getLatestZiyadah,
} from '@/lib/weeklyReportCalculator'

interface SectionTahfidzKualitasProps {
  students: Student[]
  submissions: Submission[]
  attentionPoint: string
  onAttentionPointChange: (val: string) => void
  catatanPerkembangan: Record<number, string>
  onCatatanPerkembanganChange: (id: number, val: string) => void
  readOnly?: boolean
}

export const SectionTahfidzKualitas: React.FC<SectionTahfidzKualitasProps> = ({
  students,
  submissions,
  attentionPoint,
  onAttentionPointChange,
  catatanPerkembangan,
  onCatatanPerkembanganChange,
  readOnly = false,
}) => {
  const activeStudents = students.filter((s) => s.status === 'aktif')

  const handleAutoSuggestAttention = () => {
    if (readOnly) return
    // Detect students with 'mengulang' or scores below 75
    const needAttentionStudents: string[] = []
    activeStudents.forEach((st) => {
      const stSubs = submissions.filter((s) => s.student_id === st.id)
      const hasMengulang = stSubs.some((s) => s.status === 'mengulang')
      const lowScore = stSubs.some((s) => s.nilai !== null && s.nilai !== undefined && s.nilai < 75)
      if (hasMengulang || lowScore) {
        needAttentionStudents.push(st.nama)
      }
    })

    let draft = ''
    if (needAttentionStudents.length > 0) {
      draft = `Perhatian khusus pada santri ${needAttentionStudents.join(', ')} terkait penguatan kelancaran dan pengulangan muraja'ah juz yang belum mutqin.`
    } else {
      draft = 'Seluruh santri menunjukkan kualitas hafalan dan tajwid yang stabil pekan ini tanpa ada kendala kelancaran mayoritas yang signifikan.'
    }

    if (attentionPoint.trim()) {
      onAttentionPointChange(`${attentionPoint}\n\n${draft}`)
    } else {
      onAttentionPointChange(draft)
    }
  }

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-neutral-800" />
          <div>
            <CardTitle className="text-base font-bold text-neutral-900">
              Bagian 5 — Kualitas Setoran & Perkembangan Tahfidz
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Evaluasi mutu hafalan, status kelancaran mayoritas, rentang nilai, ziyadah mutakhir, dan catatan santri.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Tabel Kualitas Per Santri */}
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3 w-40">Nama Santri</th>
                  <th className="py-2.5 px-3 text-center w-28">Status Mayoritas</th>
                  <th className="py-2.5 px-3 text-center w-24">Rentang Nilai</th>
                  <th className="py-2.5 px-3 w-40">Ziyadah Terbaru</th>
                  <th className="py-2.5 px-3">Catatan Perkembangan Individual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/70">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      Tidak ada santri aktif.
                    </td>
                  </tr>
                ) : (
                  activeStudents.map((st, idx) => {
                    const stSubs = submissions.filter((s) => s.student_id === st.id)
                    const statusMayoritas = calculateMajorityStatus(stSubs)
                    const rentangNilai = calculateScoreRange(stSubs)
                    const latestZ = getLatestZiyadah(stSubs)
                    const personalNote = catatanPerkembangan[st.id] || ''

                    return (
                      <tr key={st.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-center text-neutral-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">
                          {st.nama}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {statusMayoritas === 'Lancar' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                              Lancar
                            </Badge>
                          ) : statusMayoritas === 'Kurang' ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                              Kurang
                            </Badge>
                          ) : statusMayoritas === 'Ulang' ? (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                              Ulang
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded">
                              {statusMayoritas}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-neutral-800 font-mono">
                          {rentangNilai}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-neutral-700">
                          {latestZ}
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="text"
                            value={personalNote}
                            onChange={(e) => onCatatanPerkembanganChange(st.id, e.target.value)}
                            disabled={readOnly}
                            placeholder="Catatan perkembangan khusus..."
                            className="text-xs h-7"
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attention Point / Catatan Khusus */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-neutral-800 block flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Attention Point (Aspek & Santri Perlu Perhatian Khusus Pekan Ini)
            </label>
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAutoSuggestAttention}
                className="text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-50 h-7 px-2 font-semibold gap-1"
              >
                <Plus className="h-3 w-3" />
                Sisipkan rekomendasi attention point
              </Button>
            )}
          </div>
          <Textarea
            value={attentionPoint}
            onChange={(e) => onAttentionPointChange(e.target.value)}
            disabled={readOnly}
            placeholder="Contoh: Perlu perhatian khusus pada santri yang memiliki status Ulang atau penurunan kelancaran pada surah-surah panjang..."
            rows={3}
            className="text-xs"
          />
        </div>
      </CardContent>
    </Card>
  )
}
