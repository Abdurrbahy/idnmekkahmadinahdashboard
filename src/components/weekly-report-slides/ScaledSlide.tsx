import React, { useLayoutEffect, useRef, useState } from 'react'

const DESIGN_WIDTH = 1280
const DESIGN_HEIGHT = 720

/**
 * Renders a slide at its 1280×720 design size (the same size the PDF export
 * uses) and scales it down to fit narrower screens, so phones see the whole
 * slide instead of a clipped crop of it.
 */
export const ScaledSlide: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / DESIGN_WIDTH))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden print:overflow-visible print:!h-auto"
      style={{ height: DESIGN_HEIGHT * scale }}
    >
      <div
        className="origin-top-left print:!transform-none print:!w-auto print:!h-auto"
        style={{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}

export default ScaledSlide
