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
    const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`
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

    const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

    const sameMonth = d1.getMonth() === d2.getMonth()
    const sameYear = d1.getFullYear() === d2.getFullYear()

    if (sameMonth && sameYear) {
      return `${dayNames[d1.getDay()]}, ${d1.getDate()} — ${dayNames[d2.getDay()]}, ${d2.getDate()} ${monthNames[d2.getMonth()]} ${d2.getFullYear()}`
    } else if (sameYear) {
      return `${dayNames[d1.getDay()]}, ${d1.getDate()} ${monthNames[d1.getMonth()]} — ${dayNames[d2.getDay()]}, ${d2.getDate()} ${monthNames[d2.getMonth()]} ${d2.getFullYear()}`
    } else {
      return `${dayNames[d1.getDay()]}, ${d1.getDate()} ${monthNames[d1.getMonth()]} ${d1.getFullYear()} — ${dayNames[d2.getDay()]}, ${d2.getDate()} ${monthNames[d2.getMonth()]} ${d2.getFullYear()}`
    }
  } catch {
    return `${pekanMulaiStr} — ${pekanSelesai(pekanMulaiStr)}`
  }
}

/**
 * Super compact week range for mobile header, e.g. "6 — 12 Sep" or "30 Agu — 5 Sep"
 */
export const formatPekanMobile = (pekanMulaiStr: string): string => {
  try {
    const pSelesaiStr = pekanSelesai(pekanMulaiStr)
    const d1Parts = pekanMulaiStr.split('-').map(Number)
    const d2Parts = pSelesaiStr.split('-').map(Number)

    const d1 = new Date(d1Parts[0], d1Parts[1] - 1, d1Parts[2])
    const d2 = new Date(d2Parts[0], d2Parts[1] - 1, d2Parts[2])

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

    if (d1.getMonth() === d2.getMonth()) {
      return `${d1.getDate()} — ${d2.getDate()} ${monthNames[d2.getMonth()]}`
    } else {
      return `${d1.getDate()} ${monthNames[d1.getMonth()]} — ${d2.getDate()} ${monthNames[d2.getMonth()]}`
    }
  } catch {
    return pekanMulaiStr
  }
}

/**
 * Array of 7 days starting from Ahad (Ahad, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu)
 */
export const getDaysInWeek = (pekanMulaiStr: string): { date: string; dayName: string; shortDate: string }[] => {
  const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const res: { date: string; dayName: string; shortDate: string }[] = []
  for (let i = 0; i < 7; i++) {
    const date = addDaysToDate(pekanMulaiStr, i)
    const parts = date.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    res.push({
      date,
      dayName: dayNames[i],
      shortDate: `${d.getDate()} ${monthNames[d.getMonth()]}`,
    })
  }
  return res
}

/** Ahad(0) – Kamis(4) adalah hari aktif; Jumat(5) & Sabtu(6) libur */
export const isHariAktif = (dateStr: string): boolean => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return day <= 4
}

/** 5 hari aktif dalam pekan: Ahad – Kamis */
export const getActiveDaysInWeek = (pekanMulaiStr: string): { date: string; dayName: string; shortDate: string }[] => {
  return getDaysInWeek(pekanMulaiStr).filter((d) => isHariAktif(d.date))
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
