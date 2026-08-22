/**
 * Date & Time Utilities for Mekkah & Madinah Timezone (Asia/Riyadh, UTC+3)
 * Week starts on AHAD (Sunday = 0)
 */

export const todayRiyadh = (): string => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date())
}

export const formatDateRiyadh = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export const formatDateShortRiyadh = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

export const addDaysToDate = (dateStr: string, days: number): string => {
  const parts = dateStr.split('-').map(Number)
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  d.setDate(d.getDate() + days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns the start of week date (AHAD / Sunday) for a given date
 */
export const pekanMulai = (dateStr: string): string => {
  const parts = dateStr.split('-').map(Number)
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  const dayOfWeek = d.getDay() // 0 = Ahad
  d.setDate(d.getDate() - dayOfWeek)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns the end of week date (SABTU / Saturday)
 */
export const pekanSelesai = (pekanMulaiStr: string): string => {
  return addDaysToDate(pekanMulaiStr, 6)
}

/**
 * Formats week range for navigation display, e.g. "Ahad, 17 Ags — Sabtu, 23 Ags 2026"
 */
export const formatPekanDisplay = (pekanMulaiStr: string): string => {
  try {
    const pSelesaiStr = pekanSelesai(pekanMulaiStr)
    const d1Parts = pekanMulaiStr.split('-').map(Number)
    const d2Parts = pSelesaiStr.split('-').map(Number)

    const d1 = new Date(d1Parts[0], d1Parts[1] - 1, d1Parts[2])
    const d2 = new Date(d2Parts[0], d2Parts[1] - 1, d2Parts[2])

    const str1 = d1.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
    const str2 = d2.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

    return `${str1} — ${str2}`
  } catch {
    return `${pekanMulaiStr} — ${pekanSelesai(pekanMulaiStr)}`
  }
}

/**
 * Array of 7 days starting from Ahad (Ahad, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu)
 */
export const getDaysInWeek = (pekanMulaiStr: string): { date: string; dayName: string; shortDate: string }[] => {
  const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const res: { date: string; dayName: string; shortDate: string }[] = []
  for (let i = 0; i < 7; i++) {
    const date = addDaysToDate(pekanMulaiStr, i)
    const parts = date.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    res.push({
      date,
      dayName: dayNames[i],
      shortDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    })
  }
  return res
}

/**
 * Formats timestamp to readable time or "Diubah HH:mm"
 */
export const formatUpdatedTime = (createdAt?: string, updatedAt?: string): string | null => {
  if (!updatedAt || !createdAt) return null
  const cTime = new Date(createdAt).getTime()
  const uTime = new Date(updatedAt).getTime()
  // If difference is more than 3 seconds
  if (Math.abs(uTime - cTime) > 3000) {
    const d = new Date(updatedAt)
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `Diubah ${hours}:${mins}`
  }
  return null
}
