import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

export const SlideLayout: React.FC = () => {
  useEffect(() => {
    document.body.classList.add('landscape-presentation')
    return () => {
      document.body.classList.remove('landscape-presentation')
    }
  }, [])

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-900 font-sans antialiased print:bg-white">
      <Outlet />
    </div>
  )
}

export default SlideLayout
