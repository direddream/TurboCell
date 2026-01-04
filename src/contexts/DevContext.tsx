import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface CellDesignParams {
  chemistry: 'NCM523' | 'NCM811' | 'LFP' | 'LTO' | 'NCA'
  capacity: number // Ah
  energyDensity: number // Wh/kg
  anodeThickness: number // μm
  cathodeThickness: number // μm
  electrolyteType: string
  targetCycles: number
  targetWorkload: 'fast_charging' | 'energy_storage' | 'high_power'
}

interface PredictionResult {
  lifespanRange: { min: number; max: number } // cycles
  confidence: 'high' | 'medium' | 'low'
  intervalWidth: number // percentage
  keyRisks: string[]
  contributionFactors: Array<{ factor: string; contribution: number }>
  recommendation: string
  gateTriggers: string[] // 触发Offline的原因
}

interface DevContextType {
  designParams: CellDesignParams
  setDesignParams: (params: CellDesignParams) => void
  predictionResult: PredictionResult | null
  setPredictionResult: (result: PredictionResult) => void
  shouldTriggerOffline: boolean
}

const DevContext = createContext<DevContextType | undefined>(undefined)

const defaultDesignParams: CellDesignParams = {
  chemistry: 'NCM523',
  capacity: 50,
  energyDensity: 240,
  anodeThickness: 80,
  cathodeThickness: 75,
  electrolyteType: 'EC/DMC/EMC',
  targetCycles: 1500,
  targetWorkload: 'fast_charging'
}

// 根据设计参数计算预测结果
function calculatePrediction(params: CellDesignParams): PredictionResult {
  let baseLifespan = 1000
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  let intervalWidth = 30 // percentage
  const keyRisks: string[] = []
  const gateTriggers: string[] = []
  const contributionFactors: Array<{ factor: string; contribution: number }> = []

  // 化学体系基础寿命
  const chemistryMultiplier: Record<CellDesignParams['chemistry'], number> = {
    LFP: 1.5,
    NCM523: 1.2,
    NCM811: 1.0,
    NCA: 1.1,
    LTO: 2.0
  }
  baseLifespan *= chemistryMultiplier[params.chemistry]

  // 目标工况影响
  if (params.targetWorkload === 'fast_charging') {
    baseLifespan *= 0.85
    keyRisks.push('快充应力较大,需关注SEI膜稳定性')
    contributionFactors.push({ factor: '快充倍率应力', contribution: 28 })
  } else if (params.targetWorkload === 'energy_storage') {
    baseLifespan *= 1.1
    contributionFactors.push({ factor: '循环工况温和', contribution: 15 })
  } else {
    baseLifespan *= 0.9
    keyRisks.push('高功率脉冲可能引发锂析出')
    contributionFactors.push({ factor: '高功率脉冲', contribution: 25 })
  }

  // 能量密度影响
  if (params.energyDensity > 260) {
    baseLifespan *= 0.85
    intervalWidth += 15
    confidence = 'low'
    keyRisks.push('高能量密度体系,热稳定性待验证')
    gateTriggers.push('能量密度>260Wh/kg,建议短测验证')
    contributionFactors.push({ factor: '高能量密度风险', contribution: 22 })
  } else if (params.energyDensity < 180) {
    baseLifespan *= 1.15
    confidence = 'high'
    intervalWidth = 20
    contributionFactors.push({ factor: '保守能量密度', contribution: -10 })
  }

  // 极片厚度影响
  if (params.anodeThickness > 100 || params.cathodeThickness > 90) {
    keyRisks.push('厚极片可能导致锂浓度梯度过大')
    gateTriggers.push('极片厚度超出常规范围,需仿真验证')
    intervalWidth += 10
    contributionFactors.push({ factor: '厚极片扩散限制', contribution: 18 })
  }

  // 目标循环寿命判断
  if (params.targetCycles > baseLifespan * 1.3) {
    keyRisks.push(`目标寿命${params.targetCycles}次较为激进`)
    gateTriggers.push('目标寿命超出常规预期,建议深度评估')
    confidence = 'low'
    intervalWidth += 20
  }

  // 新体系判断
  if (params.chemistry === 'NCA' || params.energyDensity > 250) {
    gateTriggers.push('新体系/高性能电芯,建议VIP深度检测')
    intervalWidth += 10
  }

  // 数据完整性检查
  if (!params.electrolyteType || params.electrolyteType === 'unknown') {
    gateTriggers.push('输入参数不完整,预测精度受限')
    confidence = 'low'
    intervalWidth += 15
  }

  // 补充贡献因子
  contributionFactors.push({ factor: '化学体系稳定性', contribution: 35 - contributionFactors.reduce((sum, f) => sum + Math.abs(f.contribution), 0) })

  // 计算最终区间
  const min = Math.round(baseLifespan * (1 - intervalWidth / 200))
  const max = Math.round(baseLifespan * (1 + intervalWidth / 200))

  // 置信度逻辑
  if (intervalWidth > 40) confidence = 'low'
  else if (intervalWidth < 25) confidence = 'high'

  const shouldTriggerOffline = gateTriggers.length > 0

  let recommendation = ''
  if (confidence === 'high' && !shouldTriggerOffline) {
    recommendation = '预测结果置信度较高,可用于方案筛选与方向判断'
  } else if (confidence === 'medium') {
    recommendation = '建议补充短测数据或发起线下深度检测以收窄区间'
  } else {
    recommendation = '当前精度不足以支撑工程决策,强烈建议发起VIP深度检测'
  }

  return {
    lifespanRange: { min, max },
    confidence,
    intervalWidth,
    keyRisks: keyRisks.slice(0, 3),
    contributionFactors: contributionFactors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 5),
    recommendation,
    gateTriggers
  }
}

export function DevProvider({ children }: { children: ReactNode }) {
  const [designParams, setDesignParams] = useState<CellDesignParams>(defaultDesignParams)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)

  // 自动计算预测结果
  const handleSetParams = (params: CellDesignParams) => {
    setDesignParams(params)
    const result = calculatePrediction(params)
    setPredictionResult(result)
  }

  const shouldTriggerOffline = predictionResult ? predictionResult.gateTriggers.length > 0 : false

  return (
    <DevContext.Provider value={{
      designParams,
      setDesignParams: handleSetParams,
      predictionResult,
      setPredictionResult,
      shouldTriggerOffline
    }}>
      {children}
    </DevContext.Provider>
  )
}

export function useDev() {
  const context = useContext(DevContext)
  if (context === undefined) {
    throw new Error('useDev must be used within a DevProvider')
  }
  return context
}
