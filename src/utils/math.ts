export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function invLerp(a: number, b: number, value: number): number {
  if (a === b) return 0
  return (value - a) / (b - a)
}

export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp(invLerp(edge0, edge1, x), 0, 1)
  return t * t * (3 - 2 * t)
}

