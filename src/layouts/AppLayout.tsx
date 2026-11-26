import React, { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

export interface AppLayoutOutletContext {
  onToggleSidebar: () => void
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  /** Pages report unsaved edits here so the sidebar can confirm before navigating away. */
  setHasUnsavedChanges: (value: boolean) => void
}

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const outletContext: AppLayoutOutletContext = {
    onToggleSidebar: () => setMobileOpen(true),
    collapsed,
    setCollapsed,
    setHasUnsavedChanges,
  }

  return (
    <div className="min-h-screen w-full flex bg-neutral-100/60 font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Sidebar (Desktop Sticky + Mobile Drawer) */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Local boundary keeps the sidebar on screen while a lazy page loads */}
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center py-24" role="status" aria-live="polite">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
              <span className="sr-only">Memuat halaman…</span>
            </div>
          }
        >
          <Outlet context={outletContext} />
        </Suspense>
      </div>
    </div>
  )
}

export default AppLayout
