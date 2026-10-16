import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import type { Activity } from '@/types/database'
import type { ProgramActivitiesData } from '@/types/weeklyReportTemplate'
import { getDaysInWeek, todayRiyadh } from '@/lib/dateUtils'

interface Slide07AktivitasProgramProps {
  currentPekan: string
  periodeFormatted: string
  operationalActivities: Activity[]
  data: ProgramActivitiesData
}

export const Slide07AktivitasProgram: React.FC<Slide07AktivitasProgramProps> = ({
  currentPekan,
  periodeFormatted,
  operationalActivities,
  data,
}) => {
  const days = getDaysInWeek(currentPekan)
  const today = todayRiyadh()

  return (
    <SlideFrame
      slideNumber={7}
      sectionCategory="AKTIVITAS PROGRAM"
      title="Aktivitas &amp; Agenda KBM Pekan Ini"
      subtitle="Jadwal pelaksanaan pembelajaran, halaqah Qur'an, dan kegiatan keislaman (Ahad — Sabtu)."
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
        {/* 7-Days Timeline Grid */}
        <div className="grid grid-cols-7 gap-2 flex-1 min-h-0">
          {days.map((day) => {
            const isFuture = day.date > today
            const isToday = day.date === today
            const isFriday = day.dayName === 'Jumat'
            const isSaturday = day.dayName === 'Sabtu'

            // Activities for this date
            const opActs = operationalActivities
              .filter((a) => a.tanggal === day.date)
              .map((a) => ({
                id: String(a.id || Math.random()),
                nama: a.judul || a.activity_type?.nama || 'Aktivitas Harian',
                status: 'Terlaksana',
              }))
            const manualActs = (data.manual_activities || [])
              .filter((a) => a.tanggal === day.date)
              .map((a) => ({
                id: a.id,
                nama: a.nama_kegiatan,
                status: a.status,
              }))
            const allActs = [...opActs, ...manualActs]

            return (
              <div
                key={day.date}
                className="rounded-lg border p-2 flex flex-col justify-between bg-white min-h-0 shadow-2xs"
                style={{
                  borderColor: isToday ? SLIDE_THEME.primaryNavy : SLIDE_THEME.borderGrey,
                  borderWidth: isToday ? '1.5px' : '1px',
                }}
              >
                <div>
                  {/* Day Header */}
                  <div
                    className="flex items-center justify-between pb-1 mb-1.5 border-b"
                    style={{ borderColor: SLIDE_THEME.borderGrey }}
                  >
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wide"
                      style={{ color: isToday ? SLIDE_THEME.primaryNavy : SLIDE_THEME.textPrimary }}
                    >
                      {day.dayName}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400">
                      {day.shortDate}
                    </span>
                  </div>

                  {/* Day Content */}
                  {isFuture ? (
                    <div className="text-[9.5px] text-neutral-400 italic mt-3">
                      Belum berlangsung
                    </div>
                  ) : allActs.length === 0 ? (
                    isFriday ? (
                      <div
                        className="text-[9.5px] font-bold rounded p-1 text-center mt-3"
                        style={{ backgroundColor: SLIDE_THEME.lightGrey, color: SLIDE_THEME.textSecondary }}
                      >
                        Libur KBM
                      </div>
                    ) : isSaturday ? (
                      <div
                        className="text-[9.5px] font-bold rounded p-1 text-center mt-3"
                        style={{ backgroundColor: SLIDE_THEME.lightBlue, color: SLIDE_THEME.primaryNavy }}
                      >
                        Majelis Sama' Nabawi
                      </div>
                    ) : (
                      <div className="text-[9.5px] text-neutral-400 italic mt-3">
                        KBM Rutin
                      </div>
                    )
                  ) : (
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {allActs.slice(0, 3).map((act, idx) => (
                        <div
                          key={act.id || idx}
                          className="p-1 rounded bg-neutral-50 border text-[9px]"
                          style={{ borderColor: SLIDE_THEME.borderGrey }}
                        >
                          <div className="font-bold text-neutral-900 truncate">
                            {act.nama}
                          </div>
                          <span
                            className="text-[8px] font-extrabold uppercase"
                            style={{
                              color: act.status === 'Terlaksana' ? '#137333' : SLIDE_THEME.secondaryBlue,
                            }}
                          >
                            {act.status || 'Terlaksana'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Day status badge at bottom */}
                <div className="pt-1 border-t text-[8.5px] font-mono text-neutral-400 flex justify-between" style={{ borderColor: SLIDE_THEME.borderGrey }}>
                  <span>{isFriday || isSaturday ? 'Weekend' : 'KBM Aktif'}</span>
                  {isToday && <span className="font-bold text-blue-700">Hari ini</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Panel: Catatan Umum Program */}
        <div
          className="p-2 sm:p-2.5 rounded-lg border text-[11px] shrink-0"
          style={{
            backgroundColor: SLIDE_THEME.lightBlue,
            borderColor: SLIDE_THEME.borderGrey,
          }}
        >
          <span className="font-bold uppercase tracking-wider text-[10px] block" style={{ color: SLIDE_THEME.primaryNavy }}>
            Catatan Pelaksanaan Agenda Program:
          </span>
          <p className="text-[10px] sm:text-[11px] text-neutral-800 line-clamp-2 mt-0.5 leading-snug">
            {data.catatan_umum?.trim()
              ? data.catatan_umum
              : 'Seluruh rangkaian halaqah dan taklim berjalan tepat waktu sesuai kalender operasional cabang Mekkah & Madinah.'}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}
