import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import type { KendalaData } from '@/types/weeklyReportTemplate'

interface Slide09KendalaProps {
  currentPekan: string
  periodeFormatted: string
  data: KendalaData
}

export const Slide09Kendala: React.FC<Slide09KendalaProps> = ({
  periodeFormatted,
  data,
}) => {
  const isExplicitlyNoKendala = Boolean(data.tidak_ada_kendala)
  const items = data.items || []

  return (
    <SlideFrame
      slideNumber={9}
      sectionCategory="KENDALA & TINDAK LANJUT"
      title="Identifikasi Kendala &amp; Tindak Lanjut Solutif"
      subtitle="Pemetaan hambatan operasional KBM/asrama beserta rencana penyelesaian terukur."
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 flex flex-col justify-between min-h-0">
        {isExplicitlyNoKendala ? (
          /* Case A: Explisit Tidak Ada Kendala */
          <div
            className="my-auto p-6 sm:p-8 rounded-xl border text-center space-y-2 max-w-xl mx-auto"
            style={{
              backgroundColor: '#E6F4EA',
              borderColor: '#CEEAD6',
            }}
          >
            <div className="text-sm sm:text-base font-bold text-emerald-900">
              Alhamdulillah, Tidak Ada Kendala Operasional Signifikan
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Seluruh agenda halaqah, pembelajaran bahasa Arab, mutabaah, dan kedisiplinan santri berlangsung lancar, tertib, dan kondusif pada pekan ini.
            </p>
          </div>
        ) : items.length === 0 ? (
          /* Case B: Belum Ada Data */
          <div
            className="my-auto p-6 sm:p-8 rounded-xl border text-center space-y-2 max-w-xl mx-auto"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <div className="text-xs sm:text-sm font-bold text-neutral-600">
              Belum Ada Data Kendala Tercatat
            </div>
            <p className="text-[11px] text-neutral-500">
              Laporan kendala operasional belum diisi pada form mingguan pekan ini.
            </p>
          </div>
        ) : (
          /* Case C: Paired List of Kendala vs Tindak Lanjut */
          <div className="space-y-2 overflow-y-auto pr-1">
            <div
              className="grid grid-cols-12 text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b"
              style={{
                borderColor: SLIDE_THEME.borderGrey,
                color: SLIDE_THEME.textSecondary,
              }}
            >
              <div className="col-span-5 px-2">Kendala &amp; Dampak Program</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-6 px-2">Rencana Tindak Lanjut &amp; PIC</div>
            </div>

            {items.slice(0, 4).map((item, idx) => {
              const priorityBg =
                item.prioritas === 'Mendesak'
                  ? '#FCE8E6'
                  : item.prioritas === 'Tinggi'
                  ? '#FEF7E0'
                  : item.prioritas === 'Sedang'
                  ? '#EAF1F7'
                  : '#F5F6F7'
              const priorityColor =
                item.prioritas === 'Mendesak'
                  ? '#C5221F'
                  : item.prioritas === 'Tinggi'
                  ? '#B06000'
                  : item.prioritas === 'Sedang'
                  ? SLIDE_THEME.primaryNavy
                  : '#68717D'

              return (
                <div
                  key={item.id || idx}
                  className="grid grid-cols-12 gap-2 p-2 rounded-lg border bg-white items-center shadow-2xs text-[11px]"
                  style={{ borderColor: SLIDE_THEME.borderGrey }}
                >
                  {/* Left: Kendala & Dampak (5 cols) */}
                  <div className="col-span-5 px-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[8.5px] font-extrabold uppercase px-1.5 py-0.2 rounded"
                        style={{ backgroundColor: priorityBg, color: priorityColor }}
                      >
                        {item.prioritas || 'Sedang'}
                      </span>
                      <span className="font-bold text-neutral-900 truncate text-[11px]">
                        {item.judul}
                      </span>
                    </div>
                    {item.dampak && (
                      <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                        Dampak: {item.dampak}
                      </p>
                    )}
                  </div>

                  {/* Middle: Status (1 col) */}
                  <div className="col-span-1 text-center">
                    <span className="text-[9px] font-bold text-neutral-600 bg-neutral-100 px-1 py-0.5 rounded">
                      {item.status === 'Selesai' ? 'Selesai' : 'Proses'}
                    </span>
                  </div>

                  {/* Right: Tindak Lanjut & PIC (6 cols) */}
                  <div className="col-span-6 px-1 border-l pl-2.5 min-w-0" style={{ borderColor: SLIDE_THEME.borderGrey }}>
                    <div className="font-semibold text-neutral-800 text-[10.5px] truncate">
                      {item.tindak_lanjut}
                    </div>
                    <div className="flex items-center gap-3 text-[9.5px] text-neutral-400 mt-0.5">
                      {item.penanggung_jawab && <span>PIC: {item.penanggung_jawab}</span>}
                      {item.target_penyelesaian && <span>Target: {item.target_penyelesaian}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </SlideFrame>
  )
}
