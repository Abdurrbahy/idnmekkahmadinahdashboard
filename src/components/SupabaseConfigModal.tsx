import React, { useState, useEffect } from 'react'
import { X, Database, CheckCircle2, AlertCircle, ExternalLink, KeyRound, Globe, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
} from '@/lib/supabase'

interface SupabaseConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConnectionSuccess: () => void
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess,
}) => {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [statusResult, setStatusResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials()
      setUrl(creds.url || '')
      setKey(creds.key || '')
      setStatusResult(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTest = async () => {
    setTesting(true)
    setStatusResult(null)
    const res = await testSupabaseConnection(url.trim(), key.trim())
    setTesting(false)
    setStatusResult(res)
  }

  const handleSave = async () => {
    saveSupabaseCredentials(url.trim(), key.trim())
    const res = await testSupabaseConnection(url.trim(), key.trim())
    setStatusResult(res)
    if (res.success) {
      setTimeout(() => {
        onConnectionSuccess()
        onClose()
      }, 700)
    }
  }

  const handleReset = () => {
    clearCustomSupabaseCredentials()
    const creds = getSupabaseCredentials()
    setUrl(creds.url || '')
    setKey(creds.key || '')
    setStatusResult(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Konfigurasi Supabase</h2>
              <p className="text-xs text-neutral-500">Koneksikan database cloud IDN Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-neutral-500" />
              Supabase Project URL
            </label>
            <Input
              type="text"
              placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-neutral-500" />
              Supabase Anon Key (Public)
            </label>
            <Input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          {/* Guide Alert */}
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 text-xs text-neutral-600 space-y-1.5">
            <p className="font-semibold text-neutral-800 flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-neutral-600" />
              Cara Pengaturan:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-0.5 text-neutral-600 leading-relaxed">
              <li>Buka project baru Anda di dashboard Supabase.</li>
              <li>Buka menu <b>SQL Editor</b> lalu jalankan skrip dari file <code className="bg-neutral-200/70 px-1 py-0.5 rounded text-neutral-800">supabase/schema_master.sql</code>.</li>
              <li>Salin URL & anon key dari <b>Project Settings → API</b> dan masukkan ke form di atas.</li>
            </ol>
          </div>

          {/* Status feedback */}
          {statusResult && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
                statusResult.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              {statusResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{statusResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</p>
                <p className="mt-0.5 text-[11px] opacity-90">{statusResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-neutral-500 hover:text-neutral-800 gap-1.5"
            title="Reset ke pengaturan .env bawaan"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !url || !key}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Menguji...' : 'Uji Koneksi'}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={testing || !url || !key}
              className="text-xs bg-neutral-900 text-white hover:bg-neutral-800 font-semibold"
            >
              Simpan & Terapkan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
