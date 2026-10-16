import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import type { DocumentationData } from '@/types/weeklyReportTemplate'
import { Image as ImageIcon } from 'lucide-react'

interface Slide08DokumentasiProps {
  currentPekan: string
  periodeFormatted: string
  data: DocumentationData
}

export const Slide08Dokumentasi: React.FC<Slide08DokumentasiProps> = ({
  periodeFormatted,
  data,
}) => {
  const photos = data.photos || []
  const photoMap = React.useMemo(() => {
    const map: Record<number, any> = {}
    photos.forEach((p) => {
      if (p.slot) map[p.slot] = p
    })
    return map
  }, [photos])

  const slots = [1, 2, 3, 4] as const

  return (
    <SlideFrame
      slideNumber={8}
      sectionCategory="DOKUMENTASI PROGRAM"
      title="Dokumentasi Visual Aktivitas &amp; Kegiatan Santri"
      subtitle="Arsip foto kegiatan pembelajaran halaqah tahfidz, taklim nabawi, dan keseharian santri."
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-3 min-h-0">
        {slots.map((slot) => {
          const item = photoMap[slot]
          const hasPhoto = Boolean(item?.public_url)

          return (
            <div
              key={slot}
              className="rounded-lg border p-2 flex flex-col justify-between bg-white overflow-hidden shadow-2xs"
              style={{ borderColor: SLIDE_THEME.borderGrey }}
            >
              {/* Image Preview Container (16:9 ratio inside) */}
              <div className="relative aspect-video w-full rounded bg-neutral-100 overflow-hidden flex items-center justify-center border" style={{ borderColor: SLIDE_THEME.borderGrey }}>
                {hasPhoto ? (
                  <img
                    src={item.public_url}
                    alt={`Dokumentasi 0${slot}`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-3 text-neutral-400">
                    <ImageIcon className="h-6 w-6 stroke-1 text-neutral-300 mb-1" />
                    <span className="text-[10px] font-semibold">
                      Dokumentasi belum tersedia
                    </span>
                    <span className="text-[8.5px] text-neutral-400 mt-0.5">
                      Slot Photo 0{slot}
                    </span>
                  </div>
                )}

                {/* Badge Number */}
                <div
                  className="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase shadow-2xs"
                  style={{
                    backgroundColor: 'rgba(23, 54, 93, 0.9)',
                    color: '#FFFFFF',
                  }}
                >
                  Photo 0{slot}
                </div>
              </div>

              {/* Caption */}
              <div className="pt-1.5 px-0.5">
                <p className="text-[10px] sm:text-[10.5px] font-medium text-neutral-800 line-clamp-1 truncate">
                  {item?.caption?.trim() ? item.caption : `Aktivitas santri pekanan - Slot 0${slot}`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </SlideFrame>
  )
}
