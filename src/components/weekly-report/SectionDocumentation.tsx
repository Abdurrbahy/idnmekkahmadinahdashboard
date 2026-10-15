import React, { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Image,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import type { DocumentationData, DocumentationPhotoSlot } from '@/types/weeklyReportTemplate'
import { uploadReportPhoto, deleteReportPhoto } from '@/lib/supabase'

interface SectionDocumentationProps {
  reportId?: number
  data: DocumentationData
  onChange: (newData: DocumentationData) => void
  readOnly?: boolean
}

export const SectionDocumentation: React.FC<SectionDocumentationProps> = ({
  reportId,
  data,
  onChange,
  readOnly = false,
}) => {
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [slotErrors, setSlotErrors] = useState<Record<number, string | null>>({})
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // Ensure exactly 4 slots exist in data
  const slots: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4]
  const photoMap: Record<number, DocumentationPhotoSlot | undefined> = {}
  ;(data.photos || []).forEach((p) => {
    photoMap[p.slot] = p
  })

  const uploadedCount = slots.filter((s) => photoMap[s]?.public_url || photoMap[s]?.storage_path).length

  const handleFileSelect = async (slot: 1 | 2 | 3 | 4, file: File) => {
    if (readOnly) return
    setSlotErrors((prev) => ({ ...prev, [slot]: null }))
    setUploadingSlot(slot)

    // Validation: size & type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowed.includes(file.type.toLowerCase())) {
      setSlotErrors((prev) => ({
        ...prev,
        [slot]: 'Format file tidak didukung. Harap gunakan format JPEG, PNG, atau WebP.',
      }))
      setUploadingSlot(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setSlotErrors((prev) => ({
        ...prev,
        [slot]: 'Ukuran file melebihi batas 5MB.',
      }))
      setUploadingSlot(null)
      return
    }

    try {
      if (reportId) {
        const res = await uploadReportPhoto(reportId, slot, file)
        if (res.success && res.url) {
          updateSlotData(slot, {
            slot,
            public_url: res.url,
            storage_path: res.path,
            file_name: file.name,
            uploaded_at: new Date().toISOString(),
          })
        } else {
          // If storage upload fails (e.g. offline or bucket missing), fallback to local object URL
          const localUrl = URL.createObjectURL(file)
          updateSlotData(slot, {
            slot,
            public_url: localUrl,
            file_name: file.name,
            uploaded_at: new Date().toISOString(),
          })
          if (res.error) {
            console.warn('Storage upload fallback:', res.error)
          }
        }
      } else {
        // Report not saved yet, use local URL
        const localUrl = URL.createObjectURL(file)
        updateSlotData(slot, {
          slot,
          public_url: localUrl,
          file_name: file.name,
          uploaded_at: new Date().toISOString(),
        })
      }
    } catch (err: any) {
      setSlotErrors((prev) => ({
        ...prev,
        [slot]: err.message || 'Gagal mengunggah foto.',
      }))
    } finally {
      setUploadingSlot(null)
    }
  }

  const updateSlotData = (slot: 1 | 2 | 3 | 4, updates: Partial<DocumentationPhotoSlot>) => {
    const existing = photoMap[slot] || { slot }
    const updatedSlot: DocumentationPhotoSlot = {
      ...existing,
      ...updates,
      slot,
    }

    const newPhotos = (data.photos || []).filter((p) => p.slot !== slot)
    newPhotos.push(updatedSlot)
    newPhotos.sort((a, b) => a.slot - b.slot)

    onChange({
      ...data,
      photos: newPhotos,
    })
  }

  const handleDeleteSlot = async (slot: 1 | 2 | 3 | 4) => {
    if (readOnly) return
    const target = photoMap[slot]
    if (target?.storage_path) {
      try {
        await deleteReportPhoto(target.storage_path)
      } catch (e) {
        console.warn('Error deleting photo from storage:', e)
      }
    }

    const newPhotos = (data.photos || []).filter((p) => p.slot !== slot)
    onChange({
      ...data,
      photos: newPhotos,
    })
    setSlotErrors((prev) => ({ ...prev, [slot]: null }))
  }

  const handleCaptionChange = (slot: 1 | 2 | 3 | 4, caption: string) => {
    updateSlotData(slot, { caption })
  }

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-neutral-800" />
            <div>
              <CardTitle className="text-base font-bold text-neutral-900">
                Bagian 8 — Dokumentasi Kegiatan (Tepat 4 Foto)
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Empat foto dokumentasi utama kegiatan KBM dan santri selama satu pekan (format JPEG, PNG, WebP max 5MB).
              </CardDescription>
            </div>
          </div>

          <Badge
            variant={uploadedCount === 4 ? 'default' : 'outline'}
            className={`text-xs font-semibold px-2.5 py-1 ${
              uploadedCount === 4
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-700 border-neutral-300'
            }`}
          >
            {uploadedCount === 0
              ? 'Belum ada dokumentasi'
              : `${uploadedCount} dari 4 foto telah diunggah`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slots.map((slot) => {
            const photo = photoMap[slot]
            const isUploading = uploadingSlot === slot
            const error = slotErrors[slot]
            const hasPhoto = Boolean(photo?.public_url)

            return (
              <div
                key={slot}
                className="rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-3 flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div>
                  {/* Slot Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-800">
                      Photo 0{slot}
                    </span>
                    {hasPhoto ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Terunggah
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        Slot Kosong
                      </span>
                    )}
                  </div>

                  {/* Photo Preview / Upload Dropzone */}
                  <div className="relative aspect-video w-full rounded-lg border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center">
                    {hasPhoto ? (
                      <img
                        src={photo?.public_url}
                        alt={`Photo 0${slot}`}
                        className="w-full h-full object-cover"
                      />
                    ) : isUploading ? (
                      <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                        <RefreshCw className="h-5 w-5 text-neutral-600 animate-spin" />
                        <span className="text-[11px] text-neutral-500 font-semibold">
                          Mengunggah foto...
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => !readOnly && fileInputRefs.current[slot]?.click()}
                        className={`flex flex-col items-center gap-1 p-4 text-center cursor-pointer hover:bg-neutral-50 transition-colors w-full h-full justify-center ${
                          readOnly ? 'cursor-default' : ''
                        }`}
                      >
                        <Upload className="h-6 w-6 text-neutral-400 stroke-1" />
                        <span className="text-[11px] font-bold text-neutral-700">
                          Pilih / Drop Foto
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Maksimal 5MB
                        </span>
                      </div>
                    )}

                    {/* Hidden Native File Input */}
                    <input
                      ref={(el) => {
                        fileInputRefs.current[slot] = el
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(slot, file)
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="mt-2 p-2 rounded-md bg-rose-50 border border-rose-200 text-[10px] text-rose-700 flex items-start gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Action Buttons for existing photo */}
                  {hasPhoto && !readOnly && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[slot]?.click()}
                        className="flex-1 h-7 text-[11px] font-semibold border-neutral-300 hover:bg-white"
                      >
                        Ganti
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSlot(slot)}
                        className="h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                        title="Hapus Foto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Caption Input */}
                <div>
                  <label className="text-[10px] font-bold text-neutral-600 block mb-1">
                    Caption / Keterangan Foto
                  </label>
                  <Input
                    type="text"
                    value={photo?.caption || ''}
                    onChange={(e) => handleCaptionChange(slot, e.target.value)}
                    disabled={readOnly}
                    placeholder="Contoh: Halaqah Quran bersama Syaikh di Masjid Nabawi"
                    className="text-xs h-7"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
