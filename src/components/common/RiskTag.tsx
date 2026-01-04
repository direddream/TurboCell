interface RiskTagProps {
  level: 'low' | 'medium' | 'high'
  label?: string
}

export function RiskTag({ level, label }: RiskTagProps) {
  const config = {
    low: {
      bg: '#f6ffed',
      color: '#52c41a',
      border: '#b7eb8f',
      text: label || '低风险'
    },
    medium: {
      bg: '#fff7e6',
      color: '#fa8c16',
      border: '#ffd591',
      text: label || '中风险'
    },
    high: {
      bg: '#fff1f0',
      color: '#ff4d4f',
      border: '#ffccc7',
      text: label || '高风险'
    }
  }

  const { bg, color, border, text } = config[level]

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      background: bg,
      color,
      border: `1px solid ${border}`,
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 500
    }}>
      {text}
    </span>
  )
}
