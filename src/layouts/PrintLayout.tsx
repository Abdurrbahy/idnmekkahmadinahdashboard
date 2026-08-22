import { Outlet } from 'react-router-dom'

export const PrintLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-100/40 print:bg-white text-neutral-900 font-sans antialiased">
      <Outlet />
    </div>
  )
}

export default PrintLayout
