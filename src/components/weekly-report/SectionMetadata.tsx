import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { WeeklyReportMetadata } from '@/types/weeklyReportTemplate'
import { FileText, Calendar, MapPin, User } from 'lucide-react'

interface SectionMetadataProps {
  metadata: WeeklyReportMetadata
  onChange: (meta: WeeklyReportMetadata) => void
  readOnly?: boolean
}

export const SectionMetadata: React.FC<SectionMetadataProps> = ({
  metadata,
  onChange,
  readOnly = false,
}) => {
  const handleChange = (field: keyof WeeklyReportMetadata, value: any) => {
    if (readOnly) return
    onChange({
      ...metadata,
      [field]: value,
    })
  }

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-neutral-800" />
          <div>
            <CardTitle className="text-base font-bold text-neutral-900">
              Bagian 1 — Metadata & Sampul Laporan
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Informasi identitas laporan mingguan koordinator program cabang Mekkah & Madinah.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nama Laporan */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Nama Laporan
            </label>
            <Input
              type="text"
              value={metadata.nama_laporan}
              onChange={(e) => handleChange('nama_laporan', e.target.value)}
              disabled={readOnly}
              placeholder="Laporan Pekanan Program IDN Mekkah Madinah"
              className="text-xs font-semibold h-9"
            />
          </div>

          {/* Cabang */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                Cabang Program
              </span>
            </label>
            <select
              value={metadata.cabang}
              onChange={(e) => handleChange('cabang', e.target.value)}
              disabled={readOnly}
              className="w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            >
              <option value="Mekkah & Madinah">Mekkah & Madinah (Gabungan)</option>
              <option value="Mekkah">Mekkah</option>
              <option value="Madinah">Madinah</option>
            </select>
          </div>

          {/* Koordinator / Penyusun */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-neutral-500" />
                Koordinator / Penyusun
              </span>
            </label>
            <Input
              type="text"
              value={metadata.koordinator}
              onChange={(e) => handleChange('koordinator', e.target.value)}
              disabled={readOnly}
              placeholder="Nama Ustadz / Koordinator"
              className="text-xs h-9 font-medium"
            />
          </div>

          {/* Pekan & Bulan */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Pekan Ke- & Bulan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={1}
                max={5}
                value={metadata.pekan_ke}
                onChange={(e) => handleChange('pekan_ke', Number(e.target.value) || 1)}
                disabled={readOnly}
                className="text-xs h-9 font-bold"
              />
              <Input
                type="text"
                value={`${metadata.bulan} ${metadata.tahun}`}
                disabled
                className="text-xs h-9 bg-neutral-100/80 font-medium text-neutral-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Tanggal Disiapkan */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                Tanggal Disiapkan (Hari Kamis)
              </span>
            </label>
            <Input
              type="date"
              value={metadata.tanggal_disiapkan}
              onChange={(e) => handleChange('tanggal_disiapkan', e.target.value)}
              disabled={readOnly}
              className="text-xs h-9 font-medium"
            />
          </div>

          {/* Rentang Tanggal Pekan (Auto) */}
          <div className="md:col-span-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-neutral-600 font-medium">
              Rentang Tanggal Pekan (Ahad — Sabtu):
            </span>
            <span className="font-bold text-neutral-900 font-mono">
              {metadata.tanggal_awal} s/d {metadata.tanggal_akhir}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
