import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setHasSession(false)
      return
    }

    client.auth.getSession().then(({ data: { session } }) => {
      setHasSession(Boolean(session))
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    const client = getSupabaseClient()
    if (!client) {
      setError('Koneksi ke database belum terhubung.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await client.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Gagal mengubah password.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate('/signin', { replace: true })
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-neutral-50 font-sans">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-950 text-white font-bold text-xs">
              IDN
            </div>
            <span className="font-semibold text-neutral-900 text-sm">
              Mekkah & Madinah
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">
            Setel Password Baru
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold">Password Berhasil Diubah!</h3>
            <p className="text-xs text-emerald-700">
              Mengarahkan Anda ke halaman login dalam beberapa detik...
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/signin')}
              className="mt-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Masuk Sekarang
            </Button>
          </div>
        ) : hasSession === false ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-center">
            <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
            <h3 className="text-sm font-bold">Sesi Pemulihan Tidak Ditemukan</h3>
            <p className="text-xs text-amber-700">
              Link reset password mungkin sudah kadaluwarsa atau belum dibuka dari email.
            </p>
            <Link
              to="/signin"
              className="inline-block mt-2 text-xs font-semibold text-neutral-900 underline"
            >
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="pass" className="block text-xs font-medium text-neutral-700">
                Password Baru
              </label>
              <div className="relative">
                <Input
                  id="pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 text-xs pr-10 rounded-lg border-neutral-200 focus:border-neutral-900 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPass" className="block text-xs font-medium text-neutral-700">
                Konfirmasi Password Baru
              </label>
              <Input
                id="confirmPass"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10 text-xs rounded-lg border-neutral-200 focus:border-neutral-900 focus:ring-0"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs font-semibold transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
