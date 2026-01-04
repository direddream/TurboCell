import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

interface ThreeColumnLayoutProps {
  leftPanel: ReactNode
  centerPanel: ReactNode
  rightPanel: ReactNode
  leftWidth?: number
  rightWidth?: number
}

export function ThreeColumnLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  leftWidth = 320,
  rightWidth = 360
}: ThreeColumnLayoutProps) {
  // Do not auto-collapse on small screens; rely on CSS/media and container
  // size to stack columns. User can still toggle collapse manually.
  const [leftCollapsed, setLeftCollapsed] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [stacked, setStacked] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const THRESHOLD = 1200
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        setStacked(w <= THRESHOLD)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={"layout-3col" + (stacked ? ' stacked' : '')}>
      {/* Left Panel */}
      <div
        className="layout-3col-left"
        style={{
          // expose desired widths as CSS variables so media queries can override
          ['--left-width' as any]: `${leftCollapsed ? 0 : leftWidth}px`,
          padding: leftCollapsed ? 0 : 20,
          borderWidth: leftCollapsed ? 0 : 1,
          overflow: leftCollapsed ? 'hidden' : 'auto',
        }}
      >
        {leftPanel}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setLeftCollapsed(!leftCollapsed)}
        className="layout-3col-toggle"
      >
        {leftCollapsed ? <RightOutlined /> : <LeftOutlined />}
      </button>

      {/* Center Panel */}
      <div className="layout-3col-center">
        {centerPanel}
      </div>

      {/* Right Panel */}
      <div
        className="layout-3col-right"
        style={{ ['--right-width' as any]: `${rightWidth}px` }}
      >
        {rightPanel}
      </div>
    </div>
  )
}
