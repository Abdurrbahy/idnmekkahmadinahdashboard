import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import type { ArabicSpeakingData } from '@/types/weeklyReportTemplate'

interface Slide06ArabicSpeakingProps {
  currentPekan: string
  periodeFormatted: string
  data: ArabicSpeakingData
}

export const Slide06ArabicSpeaking: React.FC<Slide06ArabicSpeakingProps> = ({
  periodeFormatted,
  data,
}) => {
  const vlogs = data.vlog_schedule || []
  const podcast = data.podcast_wat

  return (
    <SlideFrame
      slideNumber={6}
      sectionCategory="ARABIC SPEAKING PROGRAM"
      title="Pengembangan Percakapan Bahasa Arab Lisan"
      subtitle="Dokumentasi pelaksanaan Arabic Vlog harian dan Podcast Weekend Arabic Talk (WAT)."
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
        {/* Top Split: Arabic Vlog (Left 7 cols) & Podcast WAT (Right 5 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0">
          {/* Subbagian 1: Arabic Vlog Schedule (7 cols) */}
          <div
            className="md:col-span-7 rounded-lg border p-2.5 sm:p-3 flex flex-col justify-between min-h-0 bg-white"
            style={{ borderColor: SLIDE_THEME.borderGrey }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b mb-1.5" style={{ borderColor: SLIDE_THEME.borderGrey }}>
              <span className="text-[11px] font-bold" style={{ color: SLIDE_THEME.primaryNavy }}>
                1. Jadwal &amp; Capaian Arabic Vlog
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {vlogs.length} Agenda
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {vlogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 italic">
                  Belum ada jadwal rekaman Arabic Vlog tercatat untuk pekan ini.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr
                      className="border-b font-bold text-[9px] uppercase tracking-wider"
                      style={{
                        backgroundColor: SLIDE_THEME.lightGrey,
                        borderColor: SLIDE_THEME.borderGrey,
                        color: SLIDE_THEME.textSecondary,
                      }}
                    >
                      <th className="py-1 px-2 w-20">Hari</th>
                      <th className="py-1 px-2 w-32">Santri</th>
                      <th className="py-1 px-2">Topik / Materi</th>
                      <th className="py-1 px-2 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {vlogs.map((item, idx) => {
                      const isDone = item.status === 'Selesai'
                      const isPending = item.status === 'Terjadwal'
                      const isRescheduled = item.status === 'Dijadwalkan ulang'

                      return (
                        <tr key={item.id || idx} className="hover:bg-neutral-50/50">
                          <td className="py-1 px-2 font-mono text-[10px] text-neutral-600 truncate">
                            {item.hari || '—'}
                          </td>
                          <td className="py-1 px-2 font-bold text-neutral-900 truncate">
                            {item.nama_peserta || '—'}
                          </td>
                          <td className="py-1 px-2 text-neutral-700 truncate text-[10px]">
                            {item.judul_topik || 'Percakapan harian'}
                          </td>
                          <td className="py-1 px-2 text-center">
                            <span
                              className="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase"
                              style={{
                                backgroundColor: isDone ? '#E6F4EA' : isPending ? '#EAF1F7' : isRescheduled ? '#FEF7E0' : '#F5F6F7',
                                color: isDone ? '#137333' : isPending ? SLIDE_THEME.primaryNavy : isRescheduled ? '#B06000' : '#68717D',
                              }}
                            >
                              {item.status || 'Terjadwal'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Subbagian 2: Podcast WAT Card (5 cols) */}
          <div
            className="md:col-span-5 rounded-lg border p-2.5 sm:p-3 flex flex-col justify-between min-h-0"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b mb-2" style={{ borderColor: SLIDE_THEME.borderGrey }}>
              <span className="text-[11px] font-bold" style={{ color: SLIDE_THEME.primaryNavy }}>
                2. Podcast Weekend Arabic Talk (WAT)
              </span>
              <span
                className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: podcast.status === 'Sudah berjalan' ? '#E6F4EA' : '#EAF1F7',
                  color: podcast.status === 'Sudah berjalan' ? '#137333' : SLIDE_THEME.primaryNavy,
                }}
              >
                {podcast.status || 'Terjadwal'}
              </span>
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-around text-[11px]">
              <div className="bg-white p-2 rounded border" style={{ borderColor: SLIDE_THEME.borderGrey }}>
                <span className="text-[9px] font-bold uppercase text-neutral-400 block">
                  Tema Pembahasan
                </span>
                <span className="font-extrabold text-neutral-900 block mt-0.5 line-clamp-2">
                  {podcast.topik || 'Pengalaman Ibadah dan Menuntut Ilmu di Kota Nabi'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded border" style={{ borderColor: SLIDE_THEME.borderGrey }}>
                  <span className="text-[9px] font-bold uppercase text-neutral-400 block">
                    Waktu / Jadwal
                  </span>
                  <span className="font-bold text-neutral-800 text-[10px] block mt-0.5 truncate">
                    {podcast.hari_tanggal || 'Sabtu Malam Ba\'da Isya'}
                  </span>
                </div>

                <div className="bg-white p-2 rounded border" style={{ borderColor: SLIDE_THEME.borderGrey }}>
                  <span className="text-[9px] font-bold uppercase text-neutral-400 block">
                    Host / Moderator
                  </span>
                  <span className="font-bold text-neutral-800 text-[10px] block mt-0.5 truncate">
                    {podcast.host || 'Koordinator Program'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-2 rounded border" style={{ borderColor: SLIDE_THEME.borderGrey }}>
                <span className="text-[9px] font-bold uppercase text-neutral-400 block">
                  Peserta / Narasumber
                </span>
                <span className="font-medium text-neutral-800 text-[10px] block mt-0.5 truncate">
                  {podcast.peserta || 'Santri Halaqah Bahasa'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Catatan Evaluasi Program Bahasa */}
        <div
          className="p-2 sm:p-2.5 rounded-lg border text-[11px] shrink-0"
          style={{
            backgroundColor: SLIDE_THEME.lightBlue,
            borderColor: SLIDE_THEME.borderGrey,
          }}
        >
          <span className="font-bold uppercase tracking-wider text-[10px] block" style={{ color: SLIDE_THEME.primaryNavy }}>
            Evaluasi Kemampuan Berbicara Bahasa Arab:
          </span>
          <p className="text-[10px] sm:text-[11px] text-neutral-800 line-clamp-2 mt-0.5 leading-snug">
            {data.catatan_evaluasi?.trim()
              ? data.catatan_evaluasi
              : 'Santri menunjukkan peningkatan percaya diri dalam mufradat tematik dan percakapan kontekstual di lingkungan Masjid Nabawi.'}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}
