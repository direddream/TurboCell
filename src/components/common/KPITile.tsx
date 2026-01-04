import type { ReactNode } from 'react'

interface KPITileProps {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  color?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}

export function KPITile({
  label,
  value,
  unit,
  icon,
  color = 'var(--primary)',
  trend,
  trendValue,
}: KPITileProps) {
  return (
    <div
      style={{
        padding: 20,
        background: 'var(--bg-card)',
        borderRadius: 8,
        border: '1px solid var(--border)',
        boxShadow: '0 10px 30px var(--shadow)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
        {icon && <span style={{ fontSize: 20, color }}>{icon}</span>}
      </div>

      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>

      {trend && trendValue && (
        <div
          style={{
            fontSize: 12,
            color:
              trend === 'up'
                ? 'var(--success)'
                : trend === 'down'
                  ? 'var(--danger)'
                  : 'var(--text-muted)',
          }}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </div>
      )}
    </div>
  )
}

