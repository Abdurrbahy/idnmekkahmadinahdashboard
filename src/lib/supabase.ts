import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  Profile,
  Student,
  Subject,
  KitabBab,
  AttendanceSession,
  AttendanceLog,
  Submission,
  MutabaahActivity,
  MutabaahRecord,
  ActivityType,
  Activity,
  WeeklyAttendance,
  WeeklyQuran,
  WeeklyQuiz,
  WeeklyMutabaah,
  DailyCompleteness,
  MutabaahDailyScore,
  MutabaahBonus,
  WeeklyReport,
  ReportProgressItem,
  ReportStudentIssue,
  TeacherJournalActivity,
  TeacherJournalRecord,
  ReportSocialMedia,
  KasTransaksi,
  VKasTransaksi,
} from '@/types/database'
import {
  DEFAULT_STUDENTS,
  DEFAULT_ATTENDANCE_SESSIONS,
  DEFAULT_SUBJECTS,
  DEFAULT_KITAB_BAB,
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
  if (
    error.code === 'PGRST200' ||
    error.code === 'PGRST204' ||
    error.code === '42P01' ||
    error.message?.includes('schema cache') ||
    error.message?.includes('quiz_submission_details') ||
    error.message?.includes('kitab_bab')
  ) {
    return "Tabel kuis/bab ('quiz_submission_details' / 'kitab_bab') belum dibuat di database Supabase. Silakan jalankan script SQL 'supabase/migration_v3_5_kuis.sql' di Supabase SQL Editor."
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

export async function fetchKitabBab(subjectId?: number): Promise<KitabBab[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      let query = client
        .from('kitab_bab')
        .select('*, subject:subjects(*)')
        .eq('aktif', true)
        .order('urutan', { ascending: true })

      if (subjectId) {
        query = query.eq('subject_id', subjectId)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) return data as KitabBab[]
    } catch (e) {
      console.warn('Supabase fetch kitab_bab error:', e)
    }
  }
  if (subjectId) {
    return DEFAULT_KITAB_BAB.filter((b) => b.subject_id === subjectId)
  }
  return DEFAULT_KITAB_BAB
}

export async function saveKitabBab(
  bab: Partial<KitabBab>
): Promise<{ success: boolean; data?: KitabBab; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      if (bab.id) {
        const { data, error } = await client
          .from('kitab_bab')
          .update({
            subject_id: bab.subject_id,
            kitab: bab.kitab,
            jilid: bab.jilid || null,
            nomor_bab: bab.nomor_bab,
            judul_bab: bab.judul_bab,
            halaman: bab.halaman !== undefined ? bab.halaman : null,
            urutan: bab.urutan !== undefined ? bab.urutan : bab.nomor_bab,
            aktif: bab.aktif !== undefined ? bab.aktif : true,
          })
          .eq('id', bab.id)
          .select()
          .single()

        if (error) return { success: false, error: parsePostgresError(error) }
        return { success: true, data: data as KitabBab }
      } else {
        const { data, error } = await client
          .from('kitab_bab')
          .insert({
            subject_id: bab.subject_id,
            kitab: bab.kitab,
            jilid: bab.jilid || null,
            nomor_bab: bab.nomor_bab,
            judul_bab: bab.judul_bab,
            halaman: bab.halaman !== undefined ? bab.halaman : null,
            urutan: bab.urutan !== undefined ? bab.urutan : bab.nomor_bab,
            aktif: bab.aktif !== undefined ? bab.aktif : true,
          })
          .select()
          .single()

        if (error) return { success: false, error: parsePostgresError(error) }
        return { success: true, data: data as KitabBab }
      }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function deleteKitabBab(id: number): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { error } = await client.from('kitab_bab').delete().eq('id', id)
      if (error) return { success: false, error: parsePostgresError(error) }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function fetchSubmissions(tanggal: string): Promise<Submission[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      // Stage 1: Try full query including quiz_submission_details with kitab_bab
      const { data, error } = await client
        .from('submissions')
        .select(`
          *,
          student:students(*),
          subject:subjects(*),
          quran_details:quran_submission_details(*),
          quiz_details:quiz_submission_details(*, kitab_bab:kitab_bab(*))
        `)
        .eq('tanggal', tanggal)
        .order('created_at', { ascending: false })

      if (!error && data) return data as Submission[]

      if (error) {
        console.warn('Full fetchSubmissions failed, falling back to quran_details only:', error.message)
        // Stage 2: Fallback without quiz_submission_details
        const { data: qData, error: qError } = await client
          .from('submissions')
          .select(`
            *,
            student:students(*),
            subject:subjects(*),
            quran_details:quran_submission_details(*)
          `)
          .eq('tanggal', tanggal)
          .order('created_at', { ascending: false })

        if (!qError && qData) return qData as Submission[]

        if (qError) {
          console.warn('quran_details fetchSubmissions failed, falling back to basic:', qError.message)
          // Stage 3: Fallback to basic submissions
          const { data: bData } = await client
            .from('submissions')
            .select(`*, student:students(*), subject:subjects(*)`)
            .eq('tanggal', tanggal)
            .order('created_at', { ascending: false })

          if (bData) return bData as Submission[]
        }
      }
    } catch (e) {
      console.warn('Supabase fetch submissions error:', e)
    }
  }
  return []
}

export async function insertSubmission(
  submission: Omit<Submission, 'id' | 'created_at' | 'jenis'>,
  quranDetail?: { surah_awal: number; ayat_awal: number; surah_akhir: number; ayat_akhir: number },
  quizDetail?: { kitab_bab_id?: number | null; kitab_manual?: string | null; soal_benar: number; soal_total: number }
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

      // 3. If Quiz details provided, insert into quiz_submission_details (auto-sync trigger will update capaian, satuan, nilai)
      if (quizDetail && subData) {
        try {
          const { error: quizError } = await client.from('quiz_submission_details').insert({
            submission_id: subData.id,
            kitab_bab_id: quizDetail.kitab_bab_id || null,
            kitab_manual: quizDetail.kitab_manual || null,
            soal_benar: quizDetail.soal_benar,
            soal_total: quizDetail.soal_total,
          })

          if (quizError) {
            const isTableMissing =
              quizError.code === 'PGRST200' ||
              quizError.code === 'PGRST204' ||
              quizError.code === '42P01' ||
              quizError.message?.includes('schema cache') ||
              quizError.message?.includes('quiz_submission_details')

            if (isTableMissing) {
              console.warn('quiz_submission_details table missing in Supabase. Base submission saved.')
            } else {
              await client.from('submissions').delete().eq('id', subData.id)
              return { success: false, error: parsePostgresError(quizError) }
            }
          }
        } catch (qErr: any) {
          console.warn('quiz_submission_details insert error:', qErr)
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
  quranDetail?: { id?: number; surah_awal: number; ayat_awal: number; surah_akhir: number; ayat_akhir: number },
  quizDetail?: { id?: number; kitab_bab_id?: number | null; kitab_manual?: string | null; soal_benar: number; soal_total: number }
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

      // 3. Update Quiz submission details if applicable
      if (quizDetail) {
        try {
          if (quizDetail.id) {
            const { error: quizError } = await client
              .from('quiz_submission_details')
              .update({
                kitab_bab_id: quizDetail.kitab_bab_id || null,
                kitab_manual: quizDetail.kitab_manual || null,
                soal_benar: quizDetail.soal_benar,
                soal_total: quizDetail.soal_total,
              })
              .eq('id', quizDetail.id)

            if (quizError) {
              const isTableMissing =
                quizError.code === 'PGRST200' ||
                quizError.code === 'PGRST204' ||
                quizError.code === '42P01' ||
                quizError.message?.includes('schema cache') ||
                quizError.message?.includes('quiz_submission_details')
              if (!isTableMissing) {
                return { success: false, error: parsePostgresError(quizError) }
              }
            }
          } else {
            const { error: quizError } = await client
              .from('quiz_submission_details')
              .insert({
                submission_id: id,
                kitab_bab_id: quizDetail.kitab_bab_id || null,
                kitab_manual: quizDetail.kitab_manual || null,
                soal_benar: quizDetail.soal_benar,
                soal_total: quizDetail.soal_total,
              })

            if (quizError) {
              const isTableMissing =
                quizError.code === 'PGRST200' ||
                quizError.code === 'PGRST204' ||
                quizError.code === '42P01' ||
                quizError.message?.includes('schema cache') ||
                quizError.message?.includes('quiz_submission_details')
              if (!isTableMissing) {
                return { success: false, error: parsePostgresError(quizError) }
              }
            }
          }
        } catch (qErr: any) {
          console.warn('quiz_submission_details update error:', qErr)
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

      // Stage 1: Try full select with quiz_details
      const { data, error } = await client
        .from('submissions')
        .select(`
          *,
          student:students(*),
          subject:subjects(*),
          quran_details:quran_submission_details(*),
          quiz_details:quiz_submission_details(*, kitab_bab:kitab_bab(*))
        `)
        .gte('tanggal', pekanMulaiStr)
        .lte('tanggal', pSelesaiStr)
        .order('tanggal', { ascending: true })

      if (!error && data) return data as Submission[]

      if (error) {
        // Stage 2: Fallback with quran_details only
        const { data: qData, error: qError } = await client
          .from('submissions')
          .select(`
            *,
            student:students(*),
            subject:subjects(*),
            quran_details:quran_submission_details(*)
          `)
          .gte('tanggal', pekanMulaiStr)
          .lte('tanggal', pSelesaiStr)
          .order('tanggal', { ascending: true })

        if (!qError && qData) return qData as Submission[]

        // Stage 3: Fallback basic
        const { data: bData } = await client
          .from('submissions')
          .select(`*, student:students(*), subject:subjects(*)`)
          .gte('tanggal', pekanMulaiStr)
          .lte('tanggal', pSelesaiStr)
          .order('tanggal', { ascending: true })

        if (bData) return bData as Submission[]
      }
    } catch (e) {
      console.warn('Error fetching weekly submissions:', e)
    }
  }
  return []
}

export async function fetchWeeklyQuiz(pekanMulaiStr: string): Promise<WeeklyQuiz[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('v_weekly_kuis')
        .select('*')
        .eq('pekan_mulai', pekanMulaiStr)

      if (!error && data) return data as WeeklyQuiz[]
    } catch (e) {
      console.warn('Error fetching v_weekly_kuis:', e)
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
      // Stage 1: Try full select with quiz_details
      const { data, error } = await client
        .from('submissions')
        .select(`
          *,
          student:students(*),
          subject:subjects(*),
          quran_details:quran_submission_details(*),
          quiz_details:quiz_submission_details(*, kitab_bab:kitab_bab(*))
        `)
        .gte('tanggal', mulai)
        .lte('tanggal', selesai)
        .order('tanggal', { ascending: true })

      if (!error && data) return data as Submission[]

      if (error) {
        // Stage 2: Fallback with quran_details only
        const { data: qData, error: qError } = await client
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

        if (!qError && qData) return qData as Submission[]

        // Stage 3: Fallback basic
        const { data: bData } = await client
          .from('submissions')
          .select(`*, student:students(*), subject:subjects(*)`)
          .gte('tanggal', mulai)
          .lte('tanggal', selesai)
          .order('tanggal', { ascending: true })

        if (bData) return bData as Submission[]
      }
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

// --- WEEKLY PROGRESS REPORT (INTERNAL ATASAN) SERVICES ---

export async function fetchWeeklyReport(pekanMulai: string): Promise<WeeklyReport | null> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('weekly_reports')
        .select('*')
        .eq('pekan_mulai', pekanMulai)
        .maybeSingle()
      if (!error && data) return data as WeeklyReport
    } catch (e) {
      console.warn('Error fetching weekly report:', e)
    }
  }
  return null
}

export async function saveWeeklyReport(
  report: Partial<WeeklyReport> & { pekan_mulai: string }
): Promise<{ success: boolean; data?: WeeklyReport; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('weekly_reports')
        .upsert(
          {
            pekan_mulai: report.pekan_mulai,
            status: report.status || 'draft',
            catatan_umum: report.catatan_umum || null,
            rencana_pekan_depan: report.rencana_pekan_depan || null,
            kendala: report.kendala || null,
          },
          { onConflict: 'pekan_mulai' }
        )
        .select()
        .single()

      if (error) return { success: false, error: parsePostgresError(error) }
      return { success: true, data: data as WeeklyReport }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function fetchReportProgressItems(reportId: number): Promise<ReportProgressItem[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('report_progress_items')
        .select('*')
        .eq('report_id', reportId)
        .order('urutan', { ascending: true })
      if (!error && data) return data as ReportProgressItem[]
    } catch (e) {
      console.warn('Error fetching report progress items:', e)
    }
  }
  return []
}

export async function saveReportProgressItems(
  reportId: number,
  items: Partial<ReportProgressItem>[]
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      // 1. Delete existing items for this report
      const { error: delErr } = await client
        .from('report_progress_items')
        .delete()
        .eq('report_id', reportId)
      if (delErr) return { success: false, error: parsePostgresError(delErr) }

      // 2. Insert new items if any
      if (items.length > 0) {
        const payload = items.map((item, idx) => ({
          report_id: reportId,
          urutan: item.urutan !== undefined ? item.urutan : idx + 1,
          kegiatan: item.kegiatan || '',
          tanggal: item.tanggal || null,
          hasil: item.hasil || null,
          status: item.status || 'proses',
          rptl: item.rptl || null,
        }))
        const { error: insErr } = await client
          .from('report_progress_items')
          .insert(payload)
        if (insErr) return { success: false, error: parsePostgresError(insErr) }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function copyProgressFromPreviousWeek(
  targetReportId: number,
  prevPekanMulai: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const prevRep = await fetchWeeklyReport(prevPekanMulai)
      if (!prevRep || !prevRep.id) {
        return { success: false, error: 'Tidak ditemukan laporan pada pekan sebelumnya.' }
      }
      const prevItems = await fetchReportProgressItems(prevRep.id)
      if (prevItems.length === 0) {
        return { success: false, error: 'Tidak ada item kemajuan pada pekan sebelumnya.' }
      }

      // Copy items with fresh ID
      const newItems = prevItems.map((item) => ({
        kegiatan: item.kegiatan,
        tanggal: item.tanggal,
        hasil: item.hasil,
        status: item.status,
        rptl: item.rptl,
        urutan: item.urutan,
      }))
      const saveRes = await saveReportProgressItems(targetReportId, newItems)
      if (!saveRes.success) return saveRes
      return { success: true, count: newItems.length }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function fetchReportStudentIssues(reportId: number): Promise<ReportStudentIssue[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('report_student_issues')
        .select(`*, student:students(*)`)
        .eq('report_id', reportId)
        .order('urutan', { ascending: true })
      if (!error && data) return data as ReportStudentIssue[]
    } catch (e) {
      console.warn('Error fetching report student issues:', e)
    }
  }
  return []
}

export async function saveReportStudentIssues(
  reportId: number,
  issues: Partial<ReportStudentIssue>[]
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { error: delErr } = await client
        .from('report_student_issues')
        .delete()
        .eq('report_id', reportId)
      if (delErr) return { success: false, error: parsePostgresError(delErr) }

      if (issues.length > 0) {
        const payload = issues.map((iss, idx) => ({
          report_id: reportId,
          urutan: iss.urutan !== undefined ? iss.urutan : idx + 1,
          tanggal: iss.tanggal || null,
          student_id: iss.student_id ? Number(iss.student_id) : null,
          nama_lain: iss.nama_lain || null,
          konteks: iss.konteks || null,
          masalah: iss.masalah || '',
          penanganan: iss.penanganan || null,
          hasil: iss.hasil || null,
        }))
        const { error: insErr } = await client
          .from('report_student_issues')
          .insert(payload)
        if (insErr) return { success: false, error: parsePostgresError(insErr) }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function fetchTeacherJournalActivities(): Promise<TeacherJournalActivity[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('teacher_journal_activities')
        .select('*')
        .eq('aktif', true)
        .order('urutan', { ascending: true })
      if (!error && data && data.length > 0) return data as TeacherJournalActivity[]
    } catch (e) {
      console.warn('Error fetching teacher journal activities:', e)
    }
  }
  return [
    { id: 1, kode: 'tahajjud', nama: 'Shalat tahajjud', urutan: 1, aktif: true },
    { id: 2, kode: 'qabliyah_subuh', nama: 'Shalat qabliyah subuh', urutan: 2, aktif: true },
    { id: 3, kode: 'subuh_berjamaah', nama: 'Shalat subuh berjamaah', urutan: 3, aktif: true },
    { id: 4, kode: 'halaqah_pagi', nama: 'Halaqah pagi', urutan: 4, aktif: true },
    { id: 5, kode: 'persiapan_pembelajaran', nama: 'Persiapan pembelajaran', urutan: 5, aktif: true },
    { id: 6, kode: 'menyimak_mufrodat', nama: 'Menyimak setoran mufrodat', urutan: 6, aktif: true },
    { id: 7, kode: 'dampingi_kbm_1', nama: 'Mendampingi KBM 1', urutan: 7, aktif: true },
    { id: 8, kode: 'dampingi_kbm_2', nama: 'Mendampingi KBM 2', urutan: 8, aktif: true },
    { id: 9, kode: 'dampingi_kbm_3', nama: 'Mendampingi KBM 3', urutan: 9, aktif: true },
    { id: 10, kode: 'zuhur_berjamaah', nama: 'Shalat zuhur berjamaah', urutan: 10, aktif: true },
    { id: 11, kode: 'asar_berjamaah', nama: 'Shalat asar berjamaah', urutan: 11, aktif: true },
    { id: 12, kode: 'halaqah_nabawi', nama: 'Halaqah quran bersama syaikh di Nabawi', urutan: 12, aktif: true },
    { id: 13, kode: 'maghrib_isya', nama: 'Shalat maghrib dan isya berjamaah', urutan: 13, aktif: true },
    { id: 14, kode: 'laporan_ortu', nama: 'Laporan ke orang tua', urutan: 14, aktif: true },
    { id: 15, kode: 'evaluasi_harian', nama: 'Evaluasi harian', urutan: 15, aktif: true },
  ]
}

export async function fetchTeacherJournalRecords(reportId: number): Promise<TeacherJournalRecord[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('teacher_journal_records')
        .select(`*, activity:teacher_journal_activities(*)`)
        .eq('report_id', reportId)
      if (!error && data) return data as TeacherJournalRecord[]
    } catch (e) {
      console.warn('Error fetching teacher journal records:', e)
    }
  }
  return []
}

export async function saveTeacherJournalRecords(
  reportId: number,
  records: { activity_id: number; status: 'completed' | 'partial' | 'not_done'; catatan?: string | null }[]
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const payload = records.map((r) => ({
        report_id: reportId,
        activity_id: r.activity_id,
        status: r.status,
        catatan: r.catatan || null,
      }))
      const { error } = await client
        .from('teacher_journal_records')
        .upsert(payload, { onConflict: 'report_id,activity_id' })
      if (error) return { success: false, error: parsePostgresError(error) }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function fetchReportSocialMedia(reportId: number): Promise<ReportSocialMedia[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('report_social_media')
        .select('*')
        .eq('report_id', reportId)
        .order('urutan', { ascending: true })
      if (!error && data) return data as ReportSocialMedia[]
    } catch (e) {
      console.warn('Error fetching report social media:', e)
    }
  }
  return []
}

export async function saveReportSocialMedia(
  reportId: number,
  items: Partial<ReportSocialMedia>[]
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { error: delErr } = await client
        .from('report_social_media')
        .delete()
        .eq('report_id', reportId)
      if (delErr) return { success: false, error: parsePostgresError(delErr) }

      if (items.length > 0) {
        const payload = items.map((item, idx) => ({
          report_id: reportId,
          urutan: item.urutan !== undefined ? item.urutan : idx + 1,
          kegiatan: item.kegiatan || '',
          progress: item.progress || null,
          keterangan: item.keterangan || null,
        }))
        const { error: insErr } = await client
          .from('report_social_media')
          .insert(payload)
        if (insErr) return { success: false, error: parsePostgresError(insErr) }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

// --- KAS TRANSAKSI (BUKU KAS UMUM) SERVICES ---

export async function fetchKasTransaksi(kelompok?: 'santri' | 'koordinator'): Promise<VKasTransaksi[]> {
  const client = getSupabaseClient()
  if (client) {
    try {
      let query = client.from('v_kas_transaksi').select('*').order('tanggal', { ascending: true }).order('id', { ascending: true })
      if (kelompok) {
        query = query.eq('kelompok', kelompok)
      }
      const { data, error } = await query
      if (!error && data) return data as VKasTransaksi[]
    } catch (e) {
      console.warn('Error fetching v_kas_transaksi:', e)
    }
  }
  return []
}

export async function saveKasTransaksi(
  item: Partial<KasTransaksi>
): Promise<{ success: boolean; data?: KasTransaksi; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const payload = {
        kelompok: item.kelompok || 'santri',
        tanggal: item.tanggal || todayRiyadh(),
        kebutuhan: item.kebutuhan || '',
        kategori: item.kategori || 'operasional',
        volume: item.volume !== undefined ? Number(item.volume) : 1,
        satuan: item.satuan || 'pax',
        harga: item.harga !== undefined ? Number(item.harga) : 0,
        arah: item.arah || 'keluar',
        keterangan: item.keterangan || null,
      }

      if (item.id) {
        const { data, error } = await client
          .from('kas_transaksi')
          .update(payload)
          .eq('id', item.id)
          .select()
          .single()
        if (error) return { success: false, error: parsePostgresError(error) }
        return { success: true, data: data as KasTransaksi }
      } else {
        const { data, error } = await client
          .from('kas_transaksi')
          .insert(payload)
          .select()
          .single()
        if (error) return { success: false, error: parsePostgresError(error) }
        return { success: true, data: data as KasTransaksi }
      }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

export async function deleteKasTransaksi(id: number): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { error } = await client.from('kas_transaksi').delete().eq('id', id)
      if (error) return { success: false, error: parsePostgresError(error) }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: parsePostgresError(err) }
    }
  }
  return { success: false, error: 'Database belum terhubung.' }
}

