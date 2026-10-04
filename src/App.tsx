import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'
import { PrintLayout } from './layouts/PrintLayout'
import { SlideLayout } from './layouts/SlideLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SignInPage } from './pages/SignInPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DailyInputPage } from './pages/DailyInputPage'
import { DailyReportPage } from './pages/DailyReportPage'
import { WeeklyReportPage } from './pages/WeeklyReportPage'
import { WeeklyReportFormPage } from './pages/WeeklyReportFormPage'
import { WeeklyProgressSlidesPage } from './pages/WeeklyProgressSlidesPage'
import { DailyBatchReportPage } from './pages/DailyBatchReportPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
              path="/kas"
              element={<Navigate to="/weekly-report?tab=finance" replace />}
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
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
