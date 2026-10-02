import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

interface AppLayoutProps {
  hasUnsavedChanges?: boolean
}

export const AppLayout: React.FC<AppLayoutProps> = ({ hasUnsavedChanges = false }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet context={{ onToggleSidebar: () => setMobileOpen(true), collapsed, setCollapsed }} />
      </div>
    </div>
  )
}

export default AppLayout
