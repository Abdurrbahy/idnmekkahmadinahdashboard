import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  Profile,
  Student,
  Subject,
  AttendanceSession,
  AttendanceLog,
  Submission,
  MutabaahActivity,
  MutabaahRecord,
  ActivityType,
  Activity,
  WeeklyAttendance,
  WeeklyQuran,
  WeeklyMutabaah,
  DailyCompleteness,
  MutabaahDailyScore,
  MutabaahBonus,
} from '@/types/database'
import {
  DEFAULT_STUDENTS,
  DEFAULT_ATTENDANCE_SESSIONS,
  DEFAULT_SUBJECTS,
  DEFAULT_MUTABAAH_ACTIVITIES,
  DEFAULT_ACTIVITY_TYPES,
} from '@/data/staticData'
import { todayRiyadh, pekanSelesai } from '@/lib/dateUtils'

const STORAGE_KEY_URL = 'idn_supabase_url'
const STORAGE_KEY_ANON_KEY = 'idn_supabase_anon_key'

export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || ''
  const localKey = localStorage.getItem(STORAGE_KEY_ANON_KEY) || ''

  const url = localUrl || envUrl
  const key = localKey || envKey

  const isConfigured =
    Boolean(url && key) &&
    !url.includes('your-project-id') &&
    !key.includes('your-anon-key')

  return { url, key, isConfigured }
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim())
  if (key) localStorage.setItem(STORAGE_KEY_ANON_KEY, key.trim())
  initClient()
}

export function clearCustomSupabaseCredentials() {
  localStorage.removeItem(STORAGE_KEY_URL)
  localStorage.removeItem(STORAGE_KEY_ANON_KEY)
  initClient()
}

let supabaseInstance: SupabaseClient | null = null

function initClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials()
  if (isConfigured) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
      return supabaseInstance
    } catch (e) {
      console.error('Failed to create Supabase client:', e)
      supabaseInstance = null
    }
  } else {
    supabaseInstance = null
  }
  return null
}

initClient()

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseInstance) {
    initClient()
  }
  return supabaseInstance
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  const testUrl = url || getSupabaseCredentials().url
  const testKey = key || getSupabaseCredentials().key

  if (!testUrl || !testKey || testUrl.includes('your-project-id')) {
    return { success: false, message: 'URL atau Anon Key belum diisi atau masih placeholder.' }
  }

  try {
    const client = createClient(testUrl, testKey)
    const { error } = await client.from('surahs').select('nomor').limit(1)
    if (error) {
      return { success: false, message: `Gagal query: ${error.message} (${error.code || ''})` }
    }
    return { success: true, message: `Koneksi berhasil! Terhubung ke database Supabase.` }
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menghubungi server Supabase.' }
  }
}

export function parsePostgresError(error: any): string {
  if (!error) return 'Terjadi kesalahan sistem.'
  if (error.code === '42501' || error.message?.includes('violates row-level security')) {
    return 'Anda tidak memiliki hak akses untuk mengubah data ini (Hanya Admin aktif yang memiliki izin tulis).'
  }
  if (error.code === 'P0001' || error.message?.includes('Ayat') || error.message?.includes('Rentang')) {
    return error.message
  }
  return error.message || 'Terjadi kesalahan saat berkomunikasi dengan server.'
}

// --- DATA ACCESS SERVICES ---

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const client = getSupabaseClient()
  if (!client || !userId) return null
  try {
    const { data, error } = await client.from('profiles').select('*').eq('id', userId).single()
    if (!error && data) return data as Profile
  } catch (e) {
    console.warn('Failed to fetch user profile:', e)
  }
  return null
}

export async function fetchStudents(): Promise<Student[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client.from('students').select('*').order('id', { ascending: true })
      if (!error && data && data.length > 0) return data as Student[]
      if (error) console.warn('Supabase fetch students notice:', error.message)
    } catch (e) {
      console.warn('Supabase fetch students error, falling back to static:', e)
    }
  }
  return DEFAULT_STUDENTS
}

export async function fetchAttendanceSessions(): Promise<AttendanceSession[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client.from('attendance_sessions').select('*').eq('aktif', true).order('urutan', { ascending: true })
      if (!error && data && data.length > 0) return data as AttendanceSession[]
    } catch (e) {
      console.warn('Supabase fetch attendance sessions error, falling back:', e)
    }
  }
  return DEFAULT_ATTENDANCE_SESSIONS
}

export async function fetchAttendanceLogs(tanggal: string): Promise<AttendanceLog[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client.from('attendance_logs').select('*').eq('tanggal', tanggal)
      if (!error && data) return data as AttendanceLog[]
    } catch (e) {
      console.warn('Supabase fetch attendance logs error:', e)
    }
  }
  return []
}

export async function saveAttendanceLogs(logs: AttendanceLog[]): Promise<{ success: boolean; message?: string; error?: string }> {
  const client = getSupabaseClient()
  if (client && logs.length > 0) {
    try {
      const { error } = await client.from('attendance_logs').upsert(
        logs.map((l) => ({
          student_id: l.student_id,
          session_id: l.session_id,
          tanggal: l.tanggal || todayRiyadh(),
          status: l.status,
          catatan: l.catatan || null,
        })),
        { onConflict: 'student_id,session_id,tanggal' }
      )
      if (error) {
        return { success: false, error: parsePostgresError(error) }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function fetchSubjects(): Promise<Subject[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client.from('subjects').select('*').eq('aktif', true).order('urutan', { ascending: true })
      if (!error && data && data.length > 0) return data as Subject[]
    } catch (e) {
      console.warn('Supabase fetch subjects error:', e)
    }
  }
  return DEFAULT_SUBJECTS
}

export async function fetchSubmissions(tanggal: string): Promise<Submission[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('submissions')
        .select(`
          *,
          student:students(*),
          subject:subjects(*),
          quran_details:quran_submission_details(*)
        `)
        .eq('tanggal', tanggal)
        .order('created_at', { ascending: false })

      if (!error && data) return data as Submission[]
    } catch (e) {
      console.warn('Supabase fetch submissions error:', e)
    }
  }
  return []
}

export async function insertSubmission(
  submission: Omit<Submission, 'id' | 'created_at' | 'jenis'>,
  quranDetail?: { surah_awal: number; ayat_awal: number; surah_akhir: number; ayat_akhir: number }
): Promise<{ success: boolean; data?: Submission; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      // 1. Insert into submissions
      const { data: subData, error: subError } = await client
        .from('submissions')
        .insert({
          student_id: submission.student_id,
          subject_id: submission.subject_id,
          tanggal: submission.tanggal || todayRiyadh(),
          capaian: submission.capaian,
          satuan: submission.satuan,
          status: submission.status,
          nilai: submission.nilai || null,
          catatan: submission.catatan || null,
        })
        .select()
        .single()

      if (subError) {
        return { success: false, error: parsePostgresError(subError) }
      }

      // 2. If Quran details provided, insert into quran_submission_details (validated by trigger)
      if (quranDetail && subData) {
        const { error: detailError } = await client.from('quran_submission_details').insert({
          submission_id: subData.id,
          surah_awal: quranDetail.surah_awal,
          ayat_awal: quranDetail.ayat_awal,
          surah_akhir: quranDetail.surah_akhir,
          ayat_akhir: quranDetail.ayat_akhir,
        })

        if (detailError) {
          // If range validation failed, clean up submission row
          await client.from('submissions').delete().eq('id', subData.id)
          return { success: false, error: parsePostgresError(detailError) }
        }
      }

      return { success: true, data: subData as Submission }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }

  return { success: false, error: 'Database belum terhubung.' }
}

export async function updateSubmission(
  id: number,
  submission: Partial<Submission>,
  quranDetail?: { id?: number; surah_awal: number; ayat_awal: number; surah_akhir: number; ayat_akhir: number }
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      // 1. Update submissions table
      const { error: subError } = await client
        .from('submissions')
        .update({
          student_id: submission.student_id,
          subject_id: submission.subject_id,
          tanggal: submission.tanggal,
          capaian: submission.capaian,
          satuan: submission.satuan,
          status: submission.status,
          nilai: submission.nilai || null,
          catatan: submission.catatan || null,
        })
        .eq('id', id)

      if (subError) {
        return { success: false, error: parsePostgresError(subError) }
      }

      // 2. Update Quran submission details if applicable
      if (quranDetail) {
        if (quranDetail.id) {
          const { error: detailError } = await client
            .from('quran_submission_details')
            .update({
              surah_awal: quranDetail.surah_awal,
              ayat_awal: quranDetail.ayat_awal,
              surah_akhir: quranDetail.surah_akhir,
              ayat_akhir: quranDetail.ayat_akhir,
            })
            .eq('id', quranDetail.id)

          if (detailError) {
            return { success: false, error: parsePostgresError(detailError) }
          }
        } else {
          // If no detail id, upsert or insert
          const { error: detailError } = await client
            .from('quran_submission_details')
            .insert({
              submission_id: id,
              surah_awal: quranDetail.surah_awal,
              ayat_awal: quranDetail.ayat_awal,
              surah_akhir: quranDetail.surah_akhir,
              ayat_akhir: quranDetail.ayat_akhir,
            })

          if (detailError) {
            return { success: false, error: parsePostgresError(detailError) }
          }
        }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function deleteSubmission(id: number): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { error } = await client.from('submissions').delete().eq('id', id)
      if (error) {
        return { success: false, error: parsePostgresError(error) }
      }
      return { success: true }
    } catch (e: any) {
      return { success: false, error: parsePostgresError(e) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function fetchMutabaahActivities(): Promise<MutabaahActivity[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('mutabaah_activities')
        .select('*')
        .eq('aktif', true)
        .order('urutan', { ascending: true })
      if (!error && data && data.length > 0) return data as MutabaahActivity[]
    } catch (e) {
      console.warn('Supabase fetch mutabaah activities error:', e)
    }
  }
  return DEFAULT_MUTABAAH_ACTIVITIES
}

export async function fetchMutabaahRecords(tanggal: string): Promise<MutabaahRecord[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client.from('mutabaah_records').select('*').eq('tanggal', tanggal)
      if (!error && data) return data as MutabaahRecord[]
    } catch (e) {
      console.warn('Supabase fetch mutabaah records error:', e)
    }
  }
  return []
}

export async function saveMutabaahRecords(records: MutabaahRecord[]): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client && records.length > 0) {
    try {
      const { error } = await client.from('mutabaah_records').upsert(
        records.map((r) => ({
          student_id: r.student_id,
          activity_id: r.activity_id,
          tanggal: r.tanggal || todayRiyadh(),
          status: r.status,
          jumlah: r.jumlah !== undefined ? r.jumlah : null,
          catatan: r.catatan || null,
        })),
        { onConflict: 'student_id,activity_id,tanggal' }
      )
      if (error) {
        return { success: false, error: parsePostgresError(error) }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function fetchActivityTypes(): Promise<ActivityType[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client.from('activity_types').select('*').eq('aktif', true).order('urutan', { ascending: true })
      if (!error && data && data.length > 0) return data as ActivityType[]
    } catch (e) {
      console.warn('Supabase fetch activity types error:', e)
    }
  }
  return DEFAULT_ACTIVITY_TYPES
}

export async function fetchActivities(tanggal: string): Promise<Activity[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('activities')
        .select(`
          *,
          activity_type:activity_types(*),
          media:activity_media(*)
        `)
        .eq('tanggal', tanggal)
        .order('created_at', { ascending: false })

      if (!error && data) return data as Activity[]
    } catch (e) {
      console.warn('Supabase fetch activities error:', e)
    }
  }
  return []
}

export async function saveActivity(
  activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('activities')
        .insert({
          activity_type_id: activity.activity_type_id,
          tanggal: activity.tanggal || todayRiyadh(),
          judul: activity.judul || null,
          keterangan: activity.keterangan || null,
          jumlah_hadir: activity.jumlah_hadir || null,
          jumlah_total: activity.jumlah_total || 4,
          penanggung_jawab: activity.penanggung_jawab || null,
          link_google_photo: activity.link_google_photo || null,
        })
        .select(`*, activity_type:activity_types(*)`)
        .single()

      if (error) {
        return { success: false, error: parsePostgresError(error) }
      }
      return { success: true, data: data as Activity }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }

  return { success: false, error: 'Database belum terhubung.' }
}

export async function updateActivity(
  id: number,
  activity: Partial<Activity>
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { error } = await client
        .from('activities')
        .update({
          activity_type_id: activity.activity_type_id,
          tanggal: activity.tanggal,
          judul: activity.judul || null,
          keterangan: activity.keterangan || null,
          jumlah_hadir: activity.jumlah_hadir || null,
          jumlah_total: activity.jumlah_total || 4,
          penanggung_jawab: activity.penanggung_jawab || null,
          link_google_photo: activity.link_google_photo || null,
        })
        .eq('id', id)

      if (error) {
        return { success: false, error: parsePostgresError(error) }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function deleteActivity(id: number): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { error } = await client.from('activities').delete().eq('id', id)
      if (error) {
        return { success: false, error: parsePostgresError(error) }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

// --- VIEWS / STATS SERVICES ---

export async function fetchMutabaahDailyScores(tanggal: string): Promise<MutabaahDailyScore[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('v_mutabaah_daily_score')
        .select('*')
        .eq('tanggal', tanggal)
      if (!error && data) return data as MutabaahDailyScore[]
    } catch (e) {
      console.warn('Error fetching v_mutabaah_daily_score:', e)
    }
  }
  return []
}

export async function fetchMutabaahBonus(tanggal: string): Promise<MutabaahBonus[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('v_mutabaah_bonus')
        .select('*')
        .eq('tanggal', tanggal)
      if (!error && data) return data as MutabaahBonus[]
    } catch (e) {
      console.warn('Error fetching v_mutabaah_bonus:', e)
    }
  }
  return []
}

export async function fetchWeeklyAttendance(pekanMulaiStr: string): Promise<WeeklyAttendance[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('v_weekly_attendance')
        .select('*')
        .eq('pekan_mulai', pekanMulaiStr)
      if (!error && data) return data as WeeklyAttendance[]
    } catch (e) {
      console.warn('Error fetching v_weekly_attendance:', e)
    }
  }
  return []
}

export async function fetchWeeklyQuran(pekanMulaiStr: string): Promise<WeeklyQuran[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('v_weekly_quran')
        .select('*')
        .eq('pekan_mulai', pekanMulaiStr)
      if (!error && data) return data as WeeklyQuran[]
    } catch (e) {
      console.warn('Error fetching v_weekly_quran:', e)
    }
  }
  return []
}

export async function fetchWeeklyMutabaah(pekanMulaiStr: string): Promise<WeeklyMutabaah[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('v_weekly_mutabaah')
        .select('*')
        .eq('pekan_mulai', pekanMulaiStr)
      if (!error && data) return data as WeeklyMutabaah[]
    } catch (e) {
      console.warn('Error fetching v_weekly_mutabaah:', e)
    }
  }
  return []
}

export async function fetchWeeklyActivities(pekanMulaiStr: string): Promise<Activity[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const pSelesaiStr = pekanSelesai(pekanMulaiStr)

      const { data, error } = await client
        .from('activities')
        .select(`*, activity_type:activity_types(*)`)
        .gte('tanggal', pekanMulaiStr)
        .lte('tanggal', pSelesaiStr)
        .order('tanggal', { ascending: false })

      if (!error && data) return data as Activity[]
    } catch (e) {
      console.warn('Error fetching weekly activities:', e)
    }
  }
  return []
}

export async function fetchWeeklyAttendanceLogs(pekanMulaiStr: string): Promise<AttendanceLog[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const pSelesaiStr = pekanSelesai(pekanMulaiStr)

      const { data, error } = await client
        .from('attendance_logs')
        .select('*')
        .gte('tanggal', pekanMulaiStr)
        .lte('tanggal', pSelesaiStr)

      if (!error && data) return data as AttendanceLog[]
    } catch (e) {
      console.warn('Error fetching weekly attendance logs:', e)
    }
  }
  return []
}

export async function fetchWeeklySubmissions(pekanMulaiStr: string): Promise<Submission[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const pSelesaiStr = pekanSelesai(pekanMulaiStr)

      const { data, error } = await client
        .from('submissions')
        .select(`*, student:students(*), subject:subjects(*), quran_details:quran_submission_details(*)`)
        .gte('tanggal', pekanMulaiStr)
        .lte('tanggal', pSelesaiStr)
        .order('tanggal', { ascending: true })

      if (!error && data) return data as Submission[]
    } catch (e) {
      console.warn('Error fetching weekly submissions:', e)
    }
  }
  return []
}

export async function fetchAttendanceLogsRange(mulai: string, selesai: string): Promise<AttendanceLog[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('attendance_logs')
        .select('*')
        .gte('tanggal', mulai)
        .lte('tanggal', selesai)
        .order('tanggal', { ascending: true })

      if (!error && data) return data as AttendanceLog[]
    } catch (e) {
      console.warn('Error fetching attendance logs range:', e)
    }
  }
  return []
}

export async function fetchSubmissionsRange(mulai: string, selesai: string): Promise<Submission[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('submissions')
        .select(`
          *,
          student:students(*),
          subject:subjects(*),
          quran_details:quran_submission_details(*)
        `)
        .gte('tanggal', mulai)
        .lte('tanggal', selesai)
        .order('tanggal', { ascending: true })

      if (!error && data) return data as Submission[]
    } catch (e) {
      console.warn('Error fetching submissions range:', e)
    }
  }
  return []
}

export async function fetchMutabaahRecordsRange(mulai: string, selesai: string): Promise<MutabaahRecord[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('mutabaah_records')
        .select('*')
        .gte('tanggal', mulai)
        .lte('tanggal', selesai)
        .order('tanggal', { ascending: true })

      if (!error && data) return data as MutabaahRecord[]
    } catch (e) {
      console.warn('Error fetching mutabaah records range:', e)
    }
  }
  return []
}

export async function fetchMutabaahDailyScoresRange(mulai: string, selesai: string): Promise<MutabaahDailyScore[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('v_mutabaah_daily_score')
        .select('*')
        .gte('tanggal', mulai)
        .lte('tanggal', selesai)
        .order('tanggal', { ascending: true })

      if (!error && data) return data as MutabaahDailyScore[]
    } catch (e) {
      console.warn('Error fetching v_mutabaah_daily_score range:', e)
    }
  }
  return []
}

export async function fetchDailyCompleteness(startDate: string, endDate: string): Promise<DailyCompleteness[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('v_daily_completeness')
        .select('*')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
      if (!error && data) return data as DailyCompleteness[]
    } catch (e) {
      console.warn('Error fetching v_daily_completeness:', e)
    }
  }
  return []
}
