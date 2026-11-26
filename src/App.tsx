import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'
import { PrintLayout } from './layouts/PrintLayout'
import { SlideLayout } from './layouts/SlideLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SignInPage } from './pages/SignInPage'

// Route-level code splitting: charts (recharts) and PDF export (jspdf,
// html2canvas) are only downloaded on the pages that use them.
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const DailyInputPage = lazy(() => import('./pages/DailyInputPage').then((m) => ({ default: m.DailyInputPage })))
const DailyReportPage = lazy(() => import('./pages/DailyReportPage').then((m) => ({ default: m.DailyReportPage })))
const WeeklyReportPage = lazy(() => import('./pages/WeeklyReportPage').then((m) => ({ default: m.WeeklyReportPage })))
const WeeklyReportFormPage = lazy(() => import('./pages/WeeklyReportFormPage').then((m) => ({ default: m.WeeklyReportFormPage })))
const WeeklyProgressSlidesPage = lazy(() => import('./pages/WeeklyProgressSlidesPage').then((m) => ({ default: m.WeeklyProgressSlidesPage })))
const DailyBatchReportPage = lazy(() => import('./pages/DailyBatchReportPage').then((m) => ({ default: m.DailyBatchReportPage })))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      <span className="sr-only">Memuat halaman…</span>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected Dashboard & Form Routes */}
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DailyInputPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weekly-report"
              element={
                <ProtectedRoute>
                  <WeeklyReportFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={<Navigate to="/?mode=weekly" replace />}
            />
            <Route
              path="/kas"
              element={<Navigate to="/" replace />}
            />
          </Route>

          {/* Protected Print / Report Routes (A4 Portrait) */}
          <Route element={<ProtectedRoute><PrintLayout /></ProtectedRoute>}>
            <Route path="/report/daily" element={<DailyReportPage />} />
            <Route path="/report/daily-batch" element={<DailyBatchReportPage />} />
            <Route path="/report/weekly" element={<WeeklyReportPage />} />
          </Route>

          {/* Protected Weekly Progress Report (16:9 Landscape Slides) */}
          <Route element={<ProtectedRoute><SlideLayout /></ProtectedRoute>}>
            <Route path="/report/weekly-progress" element={<WeeklyProgressSlidesPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
