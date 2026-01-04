import type { CellRecord, Chemistry } from '../demo/types'
import { clamp, smoothStep } from './math'

export interface ScenarioInput {
  application:
    | 'EV'
    | 'Storage'
    | 'Drone'
    | 'Consumer'
    | 'PowerTool'
    | 'OutdoorPower'
  energyWh: number
  nominalVoltageV: number
  peakPowerW: number
  continuousPowerW: number
  minAmbientTempC: number
  maxAmbientTempC: number
  expectedCycles: number
  cooling: 'poor' | 'normal' | 'good'
  priority: 'safety' | 'balanced' | 'performance' | 'cost'
}

export interface PackCandidate {
  ns: number
  np: number
  packNominalV: number
  packEnergyWh: number
  peakCellA: number
  contCellA: number
  peakCRate: number
  contCRate: number
  peakMargin: number
  contMargin: number
  estimatedDeltaTcontC: number
  estimatedLifeCycles: number
  warnings: string[]
}

export function getDefaultScenario(): ScenarioInput {
  return {
    application: 'EV',
    energyWh: 60_000,
    nominalVoltageV: 400,
    peakPowerW: 180_000,
    continuousPowerW: 60_000,
    minAmbientTempC: -10,
    maxAmbientTempC: 40,
    expectedCycles: 1500,
    cooling: 'good',
    priority: 'balanced',
  }
}

export function chemistryLabel(chem: Chemistry): string {
  switch (chem) {
    case 'LFP':
      return 'LFP (磷酸铁锂)'
    case 'NMC':
      return 'NMC (三元)'
    case 'NCA':
      return 'NCA (三元高镍)'
    case 'LTO':
      return 'LTO (钛酸锂)'
    default:
      return chem
  }
}

export function getUsableSocFraction(input: ScenarioInput): number {
  const base =
    input.application === 'Storage'
      ? 0.75
      : input.application === 'EV'
        ? 0.8
        : input.application === 'Drone'
          ? 0.85
          : 0.8

  const priorityAdj =
    input.priority === 'safety'
      ? -0.12
      : input.priority === 'cost'
        ? +0.06
        : input.priority === 'performance'
          ? +0.04
          : 0

  const target = clamp(base + priorityAdj, 0.6, 0.9)
  return target
}

export function estimateOcvV(cell: CellRecord, soc01: number): number {
  const soc = clamp(soc01, 0, 1)
  if (cell.chemistry === 'LFP') {
    const plateau = 3.28
    const low = 2.9 + 0.35 * smoothStep(0, 0.1, soc)
    const high = plateau + 0.25 * smoothStep(0.9, 1.0, soc)
    return clamp(
      plateau +
        (low - plateau) * (1 - smoothStep(0.12, 0.2, soc)) +
        (high - plateau) * smoothStep(0.85, 0.95, soc),
      cell.vMin,
      cell.vMax,
    )
  }
  if (cell.chemistry === 'LTO') {
    const plateau = 2.35
    const low = 1.9 + 0.35 * smoothStep(0, 0.1, soc)
    const high = plateau + 0.35 * smoothStep(0.85, 1.0, soc)
    return clamp(
      plateau +
        (low - plateau) * (1 - smoothStep(0.1, 0.2, soc)) +
        (high - plateau) * smoothStep(0.8, 0.95, soc),
      cell.vMin,
      cell.vMax,
    )
  }

  const base = 3.45 + 0.65 * smoothStep(0.05, 0.95, soc)
  const kneeLow = 0.35 * (1 - smoothStep(0.08, 0.18, soc))
  const kneeHigh = 0.25 * smoothStep(0.88, 0.98, soc)
  return clamp(base - kneeLow + kneeHigh, cell.vMin, cell.vMax)
}

export function estimateResistanceOhm(
  cell: CellRecord,
  soc01: number,
  tempC: number,
): number {
  const soc = clamp(soc01, 0, 1)
  const socFactor =
    1 +
    0.6 * (1 - smoothStep(0.1, 0.25, soc)) +
    0.5 * smoothStep(0.8, 0.95, soc)
  const coldFactor = 1 + 1.8 * (1 - smoothStep(-5, 15, tempC))
  const hotFactor = 1 - 0.15 * smoothStep(35, 55, tempC)
  const rOhm =
    (cell.resistanceMOhm25C / 1000) * socFactor * coldFactor * hotFactor
  return Math.max(rOhm, (cell.resistanceMOhm25C / 1000) * 0.6)
}

export function estimateThermalDeltaTcontC(
  cell: CellRecord,
  contCellA: number,
  ambientC: number,
  cooling: ScenarioInput['cooling'],
): number {
  const r = estimateResistanceOhm(cell, 0.5, ambientC)
  const heatW = contCellA * contCellA * r
  const k =
    cooling === 'poor' ? 0.18 : cooling === 'normal' ? 0.12 : 0.08
  return heatW * k
}

export function estimateLifeCycles(
  cell: CellRecord,
  usableSocFraction: number,
  avgTempC: number,
  contCRate: number,
): number {
  let life = cell.cycleLife80DoD25C
  const dod = clamp(usableSocFraction, 0.55, 0.95)
  life *= Math.pow(0.8 / dod, 0.55)

  if (avgTempC > 30) life *= 1 - 0.015 * (avgTempC - 30)
  if (avgTempC < 10) life *= 1 - 0.006 * (10 - avgTempC)

  if (contCRate > 1) life *= 1 - 0.08 * Math.min(3, contCRate - 1)

  return Math.max(200, Math.round(life))
}

