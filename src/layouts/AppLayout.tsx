import React from 'react'
import { Outlet } from 'react-router-dom'

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-neutral-100/60 font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <Outlet />
    </div>
  )
}
