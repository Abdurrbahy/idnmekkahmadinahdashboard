import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  LayoutGrid,
  Printer,
  FileText,
  Presentation,
  LogOut,
  ChevronLeft,
  Shield,
  Eye,
  HeartHandshake,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import logoFull from '@/assets/logo-idn-mekkah-madinah.png'
import logoMark from '@/assets/logo-idn-mark.png'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  hasUnsavedChanges?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  hasUnsavedChanges = false,
}) => {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const userRole = profile?.role || 'walsan'
  const isStaff = userRole === 'admin' || userRole === 'atasan'
  const userFullName = profile?.nama || profile?.email?.split('@')[0] || 'Pengguna'

  const confirmNavigation = (_targetPath: string, e: React.MouseEvent) => {
    if (hasUnsavedChanges) {
      const ok = window.confirm(
        'Ada data yang belum tersimpan. Perubahan Anda akan hilang jika berpindah halaman. Lanjutkan?'
      )
      if (!ok) {
        e.preventDefault()
        return false
      }
    }
    onCloseMobile()
    return true
  }

  // Precise Active Check Helpers
  const isDashboardActive =
    (location.pathname === '/' && location.search.includes('mode=weekly')) ||
    location.pathname === '/dashboard'
  const isInputHarianActive =
    location.pathname === '/' && !location.search.includes('mode=weekly')
  const isReportWeeklyActive = location.pathname === '/report/weekly'
  const isWeeklyReportFormActive = location.pathname === '/weekly-report'
  const isSlideActive = location.pathname === '/report/weekly-progress'

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-neutral-950/50 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between border-r border-neutral-200 bg-white transition-all duration-300 ease-in-out lg:sticky lg:h-screen lg:z-30 ${
          /* Mobile Drawer */
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${
          /* Desktop Width */
          collapsed ? 'lg:w-16' : 'lg:w-60'
        } w-[280px] select-none`}
      >
        {/* TOP SECTION: LOGO + NAVIGATION */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {/* Logo Header */}
          <div
            className={`flex items-center h-16 border-b border-neutral-100 shrink-0 ${
              collapsed ? 'justify-center px-0' : 'justify-between px-4'
            }`}
          >
            {collapsed ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-neutral-100 transition-colors focus:outline-none"
                title="Perluas Sidebar"
                aria-label="Perluas Sidebar"
              >
                <img
                  src={logoMark}
                  alt="IDN Boarding School — Mekkah & Madinah"
                  className="h-8 w-auto object-contain"
                />
              </button>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={(e) => confirmNavigation('/', e)}
                  className="flex items-center gap-2.5 overflow-hidden focus:outline-none"
                  title="IDN Boarding School — Mekkah & Madinah"
                >
                  <img
                    src={logoFull}
                    alt="IDN Boarding School — Mekkah & Madinah"
                    className="h-8 w-auto max-w-[170px] object-contain"
                  />
                </Link>

                {/* Desktop Collapse Toggle Button */}
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none"
                  title="Lipat Sidebar"
                  aria-label="Lipat Sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-4 flex-1">
            {/* GROUP 1: PROGRAM */}
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                  Program
                </div>
              )}
              <div className="space-y-0.5">
                {/* 1. Dashboard */}
                <NavItem
                  to="/?mode=weekly"
                  active={isDashboardActive}
                  icon={LayoutDashboard}
                  label="Dashboard"
                  collapsed={collapsed}
                  onClick={(e) => confirmNavigation('/?mode=weekly', e)}
                />

                {/* 2. Input Harian */}
                <NavItem
                  to="/"
                  active={isInputHarianActive}
                  icon={LayoutGrid}
                  label="Input Harian"
                  collapsed={collapsed}
                  onClick={(e) => confirmNavigation('/', e)}
                />

                {/* 3. Laporan Pekanan Santri */}
                <NavItem
                  to="/report/weekly"
                  active={isReportWeeklyActive}
                  icon={Printer}
                  label="Laporan Pekanan Santri"
                  collapsed={collapsed}
                  onClick={(e) => confirmNavigation('/report/weekly', e)}
                />
              </div>
            </div>

            {/* GROUP 2: KOORDINATOR (Hanya untuk Admin & Atasan) */}
            {isStaff && (
              <div className="space-y-1">
                {!collapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                    Koordinator
                  </div>
                )}
                <div className="space-y-0.5">
                  {/* 1. Form Weekly Report (Admin Only) */}
                  {userRole === 'admin' && (
                    <NavItem
                      to="/weekly-report"
                      active={isWeeklyReportFormActive}
                      icon={FileText}
                      label="Form Weekly Report"
                      collapsed={collapsed}
                      onClick={(e) => confirmNavigation('/weekly-report', e)}
                    />
                  )}

                  {/* 2. Weekly Report Koor */}
                  <NavItem
                    to="/report/weekly-progress"
                    active={isSlideActive}
                    icon={Presentation}
                    label="Weekly Report Koor"
                    collapsed={collapsed}
                    onClick={(e) => confirmNavigation('/report/weekly-progress', e)}
                  />
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* BOTTOM SECTION: PROFILE & LOGOUT */}
        <div className="p-3 border-t border-neutral-200/80 bg-neutral-50/50 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              {/* Collapsed Avatar with Tooltip */}
              <div
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-neutral-200 text-neutral-800 font-bold text-xs shadow-2xs cursor-pointer"
                title={`${userFullName} (${userRole.toUpperCase()})`}
              >
                {userFullName.charAt(0).toUpperCase()}

                {/* Floating Tooltip */}
                <div className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-neutral-900 px-2 py-1 text-xs text-white shadow-lg whitespace-nowrap group-hover:block">
                  <div className="font-semibold">{userFullName}</div>
                  <div className="text-[10px] text-neutral-400 capitalize">{userRole}</div>
                </div>
              </div>

              {/* Collapsed Logout Button */}
              <button
                type="button"
                onClick={() => signOut()}
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none"
                title="Keluar (Sign Out)"
                aria-label="Keluar"
              >
                <LogOut className="h-4 w-4" />
                <div className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-neutral-900 px-2 py-1 text-xs text-white shadow-lg whitespace-nowrap group-hover:block">
                  Keluar
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Profile Card */}
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white font-bold text-xs">
                  {userFullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-neutral-900">
                    {userFullName}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-medium">
                    {userRole === 'admin' ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : userRole === 'atasan' ? (
                      <span className="inline-flex items-center gap-0.5 text-sky-700 font-semibold">
                        <Eye className="h-3 w-3" /> Atasan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-purple-700 font-semibold">
                        <HeartHandshake className="h-3 w-3" /> Walsan
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => signOut()}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none min-h-[44px]"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

interface NavItemProps {
  to: string
  active: boolean
  icon: React.ElementType
  label: string
  collapsed: boolean
  onClick: (e: React.MouseEvent) => void
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  active,
  icon: Icon,
  label,
  collapsed,
  onClick,
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
        collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
      } ${
        active
          ? 'bg-neutral-100 text-neutral-950 font-bold border-l-2 border-neutral-900 rounded-l-none pl-2.5'
          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
      }`}
      title={collapsed ? label : undefined}
      aria-label={label}
    >
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors ${
          active ? 'text-neutral-950' : 'text-neutral-400 group-hover:text-neutral-800'
        }`}
      />
      {!collapsed && <span className="truncate">{label}</span>}

      {/* Floating Tooltip for collapsed state */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg whitespace-nowrap group-hover:block">
          {label}
        </div>
      )}
    </Link>
  )
}

export default Sidebar
