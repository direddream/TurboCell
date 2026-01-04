export function fmt(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '-'
  return value.toFixed(digits)
}

export function fmtInt(value: number): string {
  if (!Number.isFinite(value)) return '-'
  return Math.round(value).toString()
}

export function fmtPct(value01: number, digits = 0): string {
  if (!Number.isFinite(value01)) return '-'
  return `${(value01 * 100).toFixed(digits)}%`
}

