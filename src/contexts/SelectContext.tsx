import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface ScenarioParams {
  type: 'fast_charging' | 'energy_storage' | 'high_temp_storage'
  tempMin: number
  tempMax: number
  chargeRate: number
  dischargeRate: number
  socMin: number
  socMax: number
}

interface CellData {
  id: number
  model: string
  manufacturer: string
  score: number
  risk: 'low' | 'medium' | 'high'
  reasons: string[]
  energyDensity: number
  tempRange: string
  rateCapability: string
  cost: string
}

interface SelectContextType {
  scenario: ScenarioParams
  setScenario: (scenario: ScenarioParams) => void
  cells: CellData[]
  selectedCell: CellData | null
  setSelectedCell: (cell: CellData | null) => void
}

const SelectContext = createContext<SelectContextType | undefined>(undefined)

const defaultScenario: ScenarioParams = {
  type: 'fast_charging',
  tempMin: -10,
  tempMax: 45,
  chargeRate: 2.0,
  dischargeRate: 1.0,
  socMin: 10,
  socMax: 90
}

// 电芯数据库 - 根据不同的工况参数动态评分
const cellDatabase: Omit<CellData, 'score' | 'risk' | 'reasons'>[] = [
  {
    id: 1,
    model: 'NCM-523-50Ah',
    manufacturer: '厂商A',
    energyDensity: 245,
    tempRange: '-20~60°C',
    rateCapability: '3C充/2C放',
    cost: '¥450/个'
  },
  {
    id: 2,
    model: 'LFP-280Ah',
    manufacturer: '厂商B',
    energyDensity: 180,
    tempRange: '-10~55°C',
    rateCapability: '2C充/1.5C放',
    cost: '¥320/个'
  },
  {
    id: 3,
    model: 'NCM-811-75Ah',
    manufacturer: '厂商C',
    energyDensity: 285,
    tempRange: '-15~55°C',
    rateCapability: '2.5C充/2C放',
    cost: '¥580/个'
  },
  {
    id: 4,
    model: 'LTO-20Ah',
    manufacturer: '厂商D',
    energyDensity: 95,
    tempRange: '-30~65°C',
    rateCapability: '5C充/5C放',
    cost: '¥680/个'
  },
  {
    id: 5,
    model: 'NCM-622-60Ah',
    manufacturer: '厂商E',
    energyDensity: 220,
    tempRange: '-15~50°C',
    rateCapability: '2C充/1.5C放',
    cost: '¥420/个'
  }
]

// 动态计算电芯适配度
function calculateCellScore(cell: typeof cellDatabase[0], scenario: ScenarioParams): CellData {
  let score = 70
  const reasons: string[] = []

  // 温度匹配评分
  const [cellTempMin, cellTempMax] = cell.tempRange.replace('°C', '').split('~').map(Number)
  const tempMarginLow = scenario.tempMin - cellTempMin
  const tempMarginHigh = cellTempMax - scenario.tempMax

  if (tempMarginLow >= 10 && tempMarginHigh >= 15) {
    score += 15
    reasons.push('温域匹配度高 (95%)')
  } else if (tempMarginLow >= 5 && tempMarginHigh >= 10) {
    score += 10
    reasons.push('温域匹配良好 (85%)')
  } else if (tempMarginLow >= 0 && tempMarginHigh >= 0) {
    score += 5
    reasons.push('温域基本满足')
  } else {
    score -= 10
    reasons.push('温度范围不足')
  }

  // 倍率能力评分
  const [cellChargeRate, cellDischargeRate] = cell.rateCapability.split('/').map(r => parseFloat(r.replace(/[C充放]/g, '')))
  const chargeRateMargin = cellChargeRate - scenario.chargeRate
  const dischargeRateMargin = cellDischargeRate - scenario.dischargeRate

  if (chargeRateMargin >= 1 && dischargeRateMargin >= 0.5) {
    score += 12
    reasons.push('倍率余量充足')
  } else if (chargeRateMargin >= 0.5 && dischargeRateMargin >= 0) {
    score += 8
    reasons.push('倍率能力满足')
  } else if (chargeRateMargin >= 0) {
    score += 4
    reasons.push('倍率能力基本满足')
  } else {
    score -= 8
    reasons.push('倍率能力不足')
  }

  // 场景特定评分
  if (scenario.type === 'fast_charging') {
    if (cell.model.includes('NCM')) {
      score += 8
      reasons.push('适合快充应用')
    }
    if (cell.energyDensity > 240) {
      score += 5
      reasons.push('高能量密度')
    }
  } else if (scenario.type === 'energy_storage') {
    if (cell.model.includes('LFP')) {
      score += 10
      reasons.push('长循环寿命')
    }
    if (parseInt(cell.cost.replace(/[¥\/个]/g, '')) < 400) {
      score += 5
      reasons.push('成本适中')
    }
  } else if (scenario.type === 'high_temp_storage') {
    if (cellTempMax >= 60) {
      score += 10
      reasons.push('高温稳定性好')
    }
    if (cell.model.includes('LFP') || cell.model.includes('LTO')) {
      score += 5
      reasons.push('高安全性')
    }
  }

  // 高SOC高温风险评估
  if (scenario.socMax > 85 && scenario.tempMax > 40) {
    if (cell.model.includes('LFP') || cell.model.includes('LTO')) {
      score += 3
      reasons.push('高SOC高温耐受性好')
    } else {
      score -= 3
      reasons.push('高SOC高温需保护策略')
    }
  }

  // 限制分数范围
  score = Math.max(60, Math.min(98, score))

  // 确定风险等级
  let risk: 'low' | 'medium' | 'high' = 'low'
  if (tempMarginLow < 0 || tempMarginHigh < 0 || chargeRateMargin < 0) {
    risk = 'high'
  } else if (tempMarginLow < 5 || tempMarginHigh < 5 || chargeRateMargin < 0.3) {
    risk = 'medium'
  }

  // 确保至少有3条理由
  if (reasons.length < 3) {
    if (parseInt(cell.cost.replace(/[¥\/个]/g, '')) < 500) {
      reasons.push('成本适中')
    } else {
      reasons.push('性能优异')
    }
  }

  return {
    ...cell,
    score: Math.round(score),
    risk,
    reasons: reasons.slice(0, 3)
  }
}

export function SelectProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<ScenarioParams>(defaultScenario)
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null)

  // 动态计算并排序电芯列表
  const cells = cellDatabase
    .map(cell => calculateCellScore(cell, scenario))
    .sort((a, b) => b.score - a.score)

  return (
    <SelectContext.Provider value={{ scenario, setScenario, cells, selectedCell, setSelectedCell }}>
      {children}
    </SelectContext.Provider>
  )
}

export function useSelect() {
  const context = useContext(SelectContext)
  if (context === undefined) {
    throw new Error('useSelect must be used within a SelectProvider')
  }
  return context
}
