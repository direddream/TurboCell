import type { CellRecord } from '../demo/types'
import type { PackCandidate, ScenarioInput } from './battery'
import {
  estimateLifeCycles,
  estimateThermalDeltaTcontC,
  getUsableSocFraction,
} from './battery'
import { clamp } from './math'

export interface CellMatchResult {
  cell: CellRecord
  best: PackCandidate
  score: number
  bottleneck: string
}

function findBestPack(
  cell: CellRecord,
  input: ScenarioInput,
): PackCandidate | null {
  const ns = Math.round(input.nominalVoltageV / cell.nominalV)
  if (ns < 1) return null

  const packNominalV = ns * cell.nominalV
  const targetCapacityWh = input.energyWh
  const cellEnergyWh = cell.capacityAh * cell.nominalV
  const npRaw = targetCapacityWh / (ns * cellEnergyWh)
  const np = Math.max(1, Math.round(npRaw))
  const packEnergyWh = ns * np * cellEnergyWh

  const peakCellA = input.peakPowerW / packNominalV / np
  const contCellA = input.continuousPowerW / packNominalV / np
  const peakCRate = peakCellA / cell.capacityAh
  const contCRate = contCellA / cell.capacityAh

  const peakMargin = cell.maxDischargeCPulse - peakCRate
  const contMargin = cell.maxDischargeCCont - contCRate

  const usableSoc = getUsableSocFraction(input)
  const avgTemp = (input.minAmbientTempC + input.maxAmbientTempC) / 2

  const estimatedDeltaTcontC = estimateThermalDeltaTcontC(
    cell,
    contCellA,
    avgTemp,
    input.cooling,
  )

  const estimatedLifeCycles = estimateLifeCycles(
    cell,
    usableSoc,
    avgTemp + estimatedDeltaTcontC * 0.5,
    contCRate,
  )

  const warnings: string[] = []

  if (peakMargin < 0) {
    warnings.push('峰值倍率超界')
  }
  if (contMargin < 0) {
    warnings.push('持续倍率超界')
  }
  if (input.minAmbientTempC < cell.tempDischargeMinC) {
    warnings.push('低温放电风险')
  }
  if (input.maxAmbientTempC + estimatedDeltaTcontC > cell.tempDischargeMaxC) {
    warnings.push('高温放电风险')
  }
  if (input.minAmbientTempC < cell.tempChargeMinC) {
    warnings.push('低温充电禁止')
  }
  if (estimatedLifeCycles < input.expectedCycles) {
    warnings.push('寿命不达标')
  }

  return {
    ns,
    np,
    packNominalV,
    packEnergyWh,
    peakCellA,
    contCellA,
    peakCRate,
    contCRate,
    peakMargin,
    contMargin,
    estimatedDeltaTcontC,
    estimatedLifeCycles,
    warnings,
  }
}

function scoreCandidate(
  cell: CellRecord,
  pack: PackCandidate,
  input: ScenarioInput,
): { score: number; bottleneck: string } {
  let score = 100
  let bottleneck = '无明显瓶颈'

  // 1. 峰值/持续倍率
  if (pack.peakMargin < 0) {
    score -= 40
    bottleneck = '峰值倍率超界'
  } else if (pack.contMargin < 0) {
    score -= 30
    bottleneck = '持续倍率不足'
  }

  // 2. 温度边界
  if (input.minAmbientTempC < cell.tempChargeMinC) {
    score -= 15
    if (bottleneck === '无明显瓶颈') bottleneck = '低温充电受限'
  }
  if (input.minAmbientTempC < cell.tempDischargeMinC) {
    score -= 20
    if (bottleneck === '无明显瓶颈') bottleneck = '低温放电风险'
  }

  // 3. 寿命
  const lifeRatio = pack.estimatedLifeCycles / input.expectedCycles
  if (lifeRatio < 1) {
    score -= 25 * (1 - lifeRatio)
    if (bottleneck === '无明显瓶颈') bottleneck = '循环寿命不足'
  }

  // 4. 成本 (costTier: 1 最便宜)
  const costPenalty = (cell.costTier - 1) * 3
  score -= costPenalty
  if (input.priority === 'cost' && cell.costTier > 3) {
    score -= 10
    if (bottleneck === '无明显瓶颈') bottleneck = '成本偏高'
  }

  // 5. 优先级加成
  if (input.priority === 'safety' && cell.chemistry === 'LFP') {
    score += 8
  }
  if (input.priority === 'performance' && cell.maxDischargeCPulse >= 10) {
    score += 6
  }
  if (input.priority === 'cost' && cell.costTier <= 2) {
    score += 8
  }

  return { score: clamp(score, 0, 100), bottleneck }
}

export function matchScenarioToCells(
  cells: CellRecord[],
  input: ScenarioInput,
): CellMatchResult[] {
  const results: CellMatchResult[] = []

  for (const cell of cells) {
    const pack = findBestPack(cell, input)
    if (!pack) continue

    const { score, bottleneck } = scoreCandidate(cell, pack, input)
    results.push({ cell, best: pack, score, bottleneck })
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 10)
}
