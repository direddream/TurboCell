import type { CellRecord } from '../demo/types'
import { clamp, smoothStep } from './math'
import { estimateOcvV, estimateResistanceOhm } from './battery'

export interface SoaGrid {
  socAxis: number[]
  tempAxis: number[]
  dischargeA: number[][]
  chargeA: number[][]
}

export interface SoaPolicy {
  recommendedSocMinPct: number
  recommendedSocMaxPct: number
  notes: string[]
}

export function getDefaultSoaPolicy(cell: CellRecord): SoaPolicy {
  if (cell.chemistry === 'LFP') {
    return {
      recommendedSocMinPct: 10,
      recommendedSocMaxPct: 90,
      notes: ['寿命优先建议不长时间高SOC静置', '低温充电需限流/加热'],
    }
  }
  if (cell.chemistry === 'LTO') {
    return {
      recommendedSocMinPct: 5,
      recommendedSocMaxPct: 95,
      notes: ['倍率能力强，适合高功率/快充', '能量密度通常较低'],
    }
  }
  return {
    recommendedSocMinPct: 15,
    recommendedSocMaxPct: 85,
    notes: ['高SOC快充需更保守', '高温下建议降额以保护寿命'],
  }
}

function riskChargeLimitFactor(
  soc01: number,
  tempC: number,
  cell: CellRecord,
): number {
  if (tempC < cell.tempChargeMinC) return 0
  const cold = smoothStep(cell.tempChargeMinC, cell.tempChargeMinC + 15, tempC)
  const highSoc = 1 - 0.75 * smoothStep(0.85, 0.98, soc01)
  const hot = 1 - 0.4 * smoothStep(40, 55, tempC)
  return clamp(cold * highSoc * hot, 0, 1)
}

function thermalLimitFactor(tempC: number): number {
  const cold = 0.65 + 0.35 * smoothStep(-10, 15, tempC)
  const hot = 1 - 0.35 * smoothStep(45, 60, tempC)
  return clamp(cold * hot, 0.2, 1)
}

export function buildSoaGrid(cell: CellRecord): SoaGrid {
  const socAxis: number[] = []
  for (let soc = 5; soc <= 95; soc += 5) socAxis.push(soc)

  const tempAxis: number[] = []
  for (let t = -20; t <= 60; t += 5) tempAxis.push(t)

  const dischargeA: number[][] = []
  const chargeA: number[][] = []

  for (const tempC of tempAxis) {
    const disRow: number[] = []
    const chgRow: number[] = []

    for (const socPct of socAxis) {
      const soc01 = socPct / 100
      const ocv = estimateOcvV(cell, soc01)
      const r = estimateResistanceOhm(cell, soc01, tempC)

      const iDisVolt = Math.max(0, (ocv - cell.vMin) / r)
      const iChgVolt = Math.max(0, (cell.vMax - ocv) / r)

      const thermal = thermalLimitFactor(tempC)
      const iDisSpec = cell.maxDischargeCCont * cell.capacityAh
      const iChgSpec = cell.maxChargeCCont * cell.capacityAh
      const iDis = Math.min(iDisVolt, iDisSpec * thermal)

      const risk = riskChargeLimitFactor(soc01, tempC, cell)
      const iChg = Math.min(iChgVolt, iChgSpec * thermal * risk)

      disRow.push(Math.round(iDis))
      chgRow.push(Math.round(iChg))
    }

    dischargeA.push(disRow)
    chargeA.push(chgRow)
  }

  return { socAxis, tempAxis, dischargeA, chargeA }
}

