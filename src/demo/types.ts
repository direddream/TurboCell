export type Chemistry = 'LFP' | 'NMC' | 'NCA' | 'LTO'

export type FormFactor = 'cylindrical' | 'prismatic' | 'pouch'

export type DataQuality = 'datasheet' | 'estimated' | 'demo'

export type CostTier = 1 | 2 | 3 | 4 | 5

export type EnergyPriority = 'safety' | 'balanced' | 'performance' | 'cost'

export interface CellRecord {
  id: string
  model: string
  chemistry: Chemistry
  formFactor: FormFactor

  capacityAh: number
  nominalV: number
  vMin: number
  vMax: number

  maxDischargeCCont: number
  maxDischargeCPulse: number
  maxChargeCCont: number

  tempDischargeMinC: number
  tempDischargeMaxC: number
  tempChargeMinC: number
  tempChargeMaxC: number

  massG: number
  resistanceMOhm25C: number

  cycleLife80DoD25C: number
  costTier: CostTier

  dataQuality: DataQuality
  sourceNote?: string
}

