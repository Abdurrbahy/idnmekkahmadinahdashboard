import React, { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const SignInPage: React.FC = () => {
  const { signIn, user, isActive, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Forgot Password State
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  // Redirect if already authenticated
  if (!authLoading && user && isActive) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    const result = await signIn(cleanEmail, password)
    setLoading(false)

    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.error || 'Incorrect email or password.')
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError(null)

    const cleanEmail = forgotEmail.trim()
    if (!cleanEmail) {
      setResetError('Silakan masukkan email Anda.')
      return
    }

    const client = getSupabaseClient()
    if (!client) {
      setResetError('Koneksi ke server database belum terhubung.')
      return
    }

    setResetLoading(true)
    try {
      const redirectUrl = `${window.location.origin}/reset-password`
      const { error: resetErr } = await client.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      })

      if (resetErr) {
        setResetError(resetErr.message || 'Gagal mengirim email reset password.')
      } else {
        setResetSuccess(true)
      }
    } catch (err: any) {
      setResetError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 font-sans bg-white">
      {/* LEFT COLUMN: Program strengths and context (Desktop only) */}
      <div className="hidden lg:flex flex-col justify-between bg-neutral-950 text-white p-12 xl:p-16">
        {/* Top Header & Qur'anic Verse */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-neutral-950 font-bold text-xs tracking-wider">
              IDN
            </div>
            <div>
              <div className="font-semibold text-white tracking-tight text-sm">
                IDN Boarding School
              </div>
              <div className="text-xs text-neutral-400">
                Mekkah & Madinah Program
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-900 max-w-md">
            <p className="font-serif text-right text-sm text-neutral-300 leading-relaxed" dir="rtl">
              وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
            </p>
            <p className="text-xs text-neutral-500 mt-1.5 text-right font-light">
              "And recite the Qur'an with measured recitation." (QS. Al-Muzzammil: 4)
            </p>
          </div>
        </div>

        {/* Bottom Program Strengths */}
        <div className="space-y-6 max-w-lg">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-white tracking-tight">
              Studying in the Two Holy Cities
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Students live and learn in Makkah and Madinah, close to the Haramain.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-white tracking-tight">
              Daily Halaqah at the Prophet's Mosque
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Structured Qur'an circles held in Masjid an-Nabawi throughout the week.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-white tracking-tight">
              Qur'an Memorisation, Tracked Verse by Verse
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every submission is recorded and reviewed, from ziyadah through murajaah.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-white tracking-tight">
              Arabic in Its Native Environment
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Vocabulary, nahwu, and conversation practised where the language is spoken.
            </p>
          </div>

          <div className="pt-6 border-t border-neutral-900 text-[11px] text-neutral-500">
            Asia/Riyadh (UTC+3)
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sign in form */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-[360px] space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Sign in
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-neutral-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="h-10 text-xs rounded-lg border-neutral-200 focus:border-neutral-900 focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-neutral-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-10 text-xs pr-10 rounded-lg border-neutral-200 focus:border-neutral-900 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium pt-1">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs font-semibold shadow-none transition-colors"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="text-xs text-neutral-400 text-center pt-2">
            Access is provisioned by the program administrator.
          </p>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Reset Password
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Masukkan email Anda. Kami akan mengirimkan tautan untuk menyetel ulang password baru.
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 text-center">
                <p className="font-semibold">Email Reset Terkirim!</p>
                <p className="text-[11px] text-emerald-700">
                  Silakan periksa kotak masuk (atau spam) email <b>{forgotEmail}</b> dan klik link di dalamnya.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsForgotOpen(false)
                    setResetSuccess(false)
                  }}
                  className="mt-2 text-xs w-full"
                >
                  Tutup
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700">Email Akun</label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>

                {resetError && (
                  <p className="text-xs text-red-600 font-medium">
                    {resetError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsForgotOpen(false)
                      setResetError(null)
                    }}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    size="sm"
                    className="bg-neutral-900 text-white text-xs"
                  >
                    {resetLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
