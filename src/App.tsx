import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'
import { PrintLayout } from './layouts/PrintLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SignInPage } from './pages/SignInPage'
import { DailyInputPage } from './pages/DailyInputPage'
import { DailyReportPage } from './pages/DailyReportPage'
import { WeeklyReportPage } from './pages/WeeklyReportPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/signin" element={<SignInPage />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DailyInputPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Protected Print / Report Routes */}
          <Route element={<ProtectedRoute><PrintLayout /></ProtectedRoute>}>
            <Route path="/report/daily" element={<DailyReportPage />} />
            <Route path="/report/weekly" element={<WeeklyReportPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
