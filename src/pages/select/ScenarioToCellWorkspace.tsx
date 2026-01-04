import { useState, useEffect, useMemo } from 'react'
import { Select, InputNumber, Slider, Button, Tooltip, Progress, Table, Segmented } from 'antd'
import {
  RocketOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useSelect } from '../../contexts/SelectContext'
import { Link } from 'react-router-dom'

// ==================== Types ====================
type RiskLevel = 'low' | 'medium' | 'high'
type RecommendLevel = '推荐' | '备选' | '可用'
type CoverageLevel = 'high' | 'medium' | 'low'

interface CandidateCell {
  id: string
  model: string
  chemistry: string
  capacityAh: number
  maxDischargeCCont: number
  cycleLife80DoD25C: number
  tempDischargeMinC: number
  tempDischargeMaxC: number
  tempChargeMinC: number
  tempChargeMaxC: number
  score: number
  displayScore: number
  risk: RiskLevel
  recommendLevel: RecommendLevel
  lifeMatch: number
  powerMatch: number
  safetyMatch: number
  reason: string
  penalties: string[]
}

interface Constraint {
  type: 'pass' | 'warning' | 'fail'
  label: string
  detail: string
}

// ==================== Demo Data ====================
const DEMO_CELLS: Omit<CandidateCell, 'displayScore' | 'recommendLevel' | 'penalties'>[] = [
  { id: 'cell-1', model: 'LFP-280Ah', chemistry: 'LFP', capacityAh: 280, maxDischargeCCont: 1.0, cycleLife80DoD25C: 6000, tempDischargeMinC: -20, tempDischargeMaxC: 55, tempChargeMinC: 0, tempChargeMaxC: 45, score: 95, risk: 'low', lifeMatch: 98, powerMatch: 92, safetyMatch: 95, reason: '' },
  { id: 'cell-2', model: 'NCM-156Ah', chemistry: 'NCM', capacityAh: 156, maxDischargeCCont: 2.0, cycleLife80DoD25C: 3000, tempDischargeMinC: -20, tempDischargeMaxC: 60, tempChargeMinC: 0, tempChargeMaxC: 45, score: 91, risk: 'low', lifeMatch: 85, powerMatch: 96, safetyMatch: 90, reason: '' },
  { id: 'cell-3', model: 'LFP-314Ah', chemistry: 'LFP', capacityAh: 314, maxDischargeCCont: 0.5, cycleLife80DoD25C: 8000, tempDischargeMinC: -20, tempDischargeMaxC: 55, tempChargeMinC: 0, tempChargeMaxC: 45, score: 88, risk: 'medium', lifeMatch: 95, powerMatch: 78, safetyMatch: 92, reason: '' },
  { id: 'cell-4', model: 'NCM-117Ah', chemistry: 'NCM', capacityAh: 117, maxDischargeCCont: 3.0, cycleLife80DoD25C: 2500, tempDischargeMinC: -30, tempDischargeMaxC: 60, tempChargeMinC: -10, tempChargeMaxC: 45, score: 85, risk: 'medium', lifeMatch: 72, powerMatch: 98, safetyMatch: 85, reason: '' },
  { id: 'cell-5', model: 'LFP-230Ah', chemistry: 'LFP', capacityAh: 230, maxDischargeCCont: 1.5, cycleLife80DoD25C: 5000, tempDischargeMinC: -20, tempDischargeMaxC: 55, tempChargeMinC: 0, tempChargeMaxC: 45, score: 82, risk: 'medium', lifeMatch: 88, powerMatch: 85, safetyMatch: 88, reason: '' },
  { id: 'cell-6', model: 'NCM-200Ah', chemistry: 'NCM', capacityAh: 200, maxDischargeCCont: 2.5, cycleLife80DoD25C: 2800, tempDischargeMinC: -25, tempDischargeMaxC: 55, tempChargeMinC: -5, tempChargeMaxC: 45, score: 79, risk: 'medium', lifeMatch: 75, powerMatch: 90, safetyMatch: 82, reason: '' },
  { id: 'cell-7', model: 'LFP-176Ah', chemistry: 'LFP', capacityAh: 176, maxDischargeCCont: 1.2, cycleLife80DoD25C: 5500, tempDischargeMinC: -20, tempDischargeMaxC: 55, tempChargeMinC: 0, tempChargeMaxC: 45, score: 76, risk: 'high', lifeMatch: 80, powerMatch: 75, safetyMatch: 85, reason: '' },
  { id: 'cell-8', model: 'NCM-100Ah', chemistry: 'NCM', capacityAh: 100, maxDischargeCCont: 4.0, cycleLife80DoD25C: 2000, tempDischargeMinC: -30, tempDischargeMaxC: 60, tempChargeMinC: -10, tempChargeMaxC: 45, score: 72, risk: 'high', lifeMatch: 65, powerMatch: 95, safetyMatch: 78, reason: '' },
  { id: 'cell-9', model: 'LFP-320Ah', chemistry: 'LFP', capacityAh: 320, maxDischargeCCont: 0.3, cycleLife80DoD25C: 10000, tempDischargeMinC: -15, tempDischargeMaxC: 50, tempChargeMinC: 5, tempChargeMaxC: 40, score: 68, risk: 'high', lifeMatch: 92, powerMatch: 55, safetyMatch: 90, reason: '' },
  { id: 'cell-10', model: 'NCM-80Ah', chemistry: 'NCM', capacityAh: 80, maxDischargeCCont: 5.0, cycleLife80DoD25C: 1500, tempDischargeMinC: -30, tempDischargeMaxC: 65, tempChargeMinC: -15, tempChargeMaxC: 50, score: 65, risk: 'high', lifeMatch: 50, powerMatch: 98, safetyMatch: 70, reason: '' },
]

// ==================== Score Normalization ====================
function normalizeScoresForDisplay(cells: CandidateCell[]): CandidateCell[] {
  if (cells.length === 0) return cells
  const scores = cells.map(c => c.score)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  const uniqueScores = new Set(scores)
  const needsNormalization = (maxScore - minScore < 6) || (uniqueScores.size < 3 && cells.length >= 3)

  if (needsNormalization) {
    const targetMin = 68
    const targetMax = 97
    return cells.map((c, index) => {
      let displayScore: number
      if (maxScore === minScore) {
        displayScore = targetMax - index * 3
      } else {
        const normalized = (c.score - minScore) / (maxScore - minScore)
        displayScore = Math.round(targetMin + normalized * (targetMax - targetMin))
        displayScore = displayScore - index
      }
      displayScore = Math.max(0, Math.min(99, displayScore))
      return { ...c, displayScore }
    })
  }
  return cells.map(c => ({ ...c, displayScore: Math.min(99, c.score) }))
}

// ==================== Reason Generation ====================
function generateReason(cell: CandidateCell): string {
  const parts: string[] = []
  if (cell.lifeMatch >= 90) parts.push('寿命匹配优秀')
  else if (cell.lifeMatch >= 80) parts.push('寿命匹配良好')
  if (cell.powerMatch >= 90) parts.push('功率匹配优秀')
  else if (cell.powerMatch >= 80) parts.push('功率匹配良好')
  if (cell.chemistry === 'LFP') parts.push('LFP本征安全')
  else if (cell.safetyMatch >= 85) parts.push('安全裕度充足')
  return parts.slice(0, 3).join('；')
}

// ==================== Coverage Calculation ====================
function calculateCoverage(scenario: any): { level: CoverageLevel; percentage: number; missingItems: string[] } {
  const missingItems: string[] = []
  let coverage = 100

  // Check for edge cases that reduce coverage
  if (scenario.tempMin < -20) {
    coverage -= 20
    missingItems.push('极低温(-20°C以下)工况数据不足')
  }
  if (scenario.tempMax > 50) {
    coverage -= 15
    missingItems.push('高温(50°C以上)工况数据不足')
  }
  if (scenario.chargeRate > 3) {
    coverage -= 25
    missingItems.push('超快充(>3C)工况数据不足')
  }
  if (scenario.socMax > 95 || scenario.socMin < 5) {
    coverage -= 10
    missingItems.push('极端SOC边界数据不足')
  }

  let level: CoverageLevel = 'high'
  if (coverage < 60) level = 'low'
  else if (coverage < 80) level = 'medium'

  return { level, percentage: Math.max(0, coverage), missingItems }
}

// ==================== Component ====================
export default function ScenarioToCellWorkspace() {
  const { scenario, setScenario } = useSelect()
  const [candidateCells, setCandidateCells] = useState<CandidateCell[]>([])
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [showCandidates, setShowCandidates] = useState(false)
  const [displayCount, setDisplayCount] = useState<5 | 10>(5)
  const [coverage, setCoverage] = useState<{ level: CoverageLevel; percentage: number; missingItems: string[] }>({ level: 'high', percentage: 100, missingItems: [] })
  const [spectrumType, setSpectrumType] = useState<'SOC' | 'C-rate' | 'Power' | 'Temp'>('SOC')
  const [targetCycleLife] = useState(3000)

  // Generate Condition Spectrum Chart Data
  const spectrumChartOption = useMemo(() => {
    const cycleTime = 60 / scenario.chargeRate // minutes per cycle
    const totalCycles = 3
    const totalTime = cycleTime * totalCycles * 2 // charge + discharge for each cycle

    // Generate time axis with appropriate unit
    const getTimeUnit = () => {
      if (totalTime <= 60) return { unit: 'min', divisor: 1 }
      if (totalTime <= 3600) return { unit: 'h', divisor: 60 }
      return { unit: 'h', divisor: 60 }
    }
    const { unit, divisor } = getTimeUnit()

    // Generate data points
    const generateSOCData = (): [number, number][] => {
      const data: [number, number][] = []
      for (let i = 0; i < totalCycles; i++) {
        const baseTime = i * cycleTime * 2
        // Start at SOC max
        data.push([baseTime / divisor, scenario.socMax])
        // Discharge to SOC min (80% of half cycle)
        data.push([(baseTime + cycleTime * 0.8) / divisor, scenario.socMin])
        // Rest period
        data.push([(baseTime + cycleTime) / divisor, scenario.socMin])
        // Charge back to SOC max
        data.push([(baseTime + cycleTime * 1.8) / divisor, scenario.socMax])
        // Rest period
        data.push([(baseTime + cycleTime * 2) / divisor, scenario.socMax])
      }
      return data
    }

    const generateCRateData = (): [number, number][] => {
      const data: [number, number][] = []
      for (let i = 0; i < totalCycles; i++) {
        const baseTime = i * cycleTime * 2
        // Start at 0
        data.push([baseTime / divisor, 0])
        // Discharge (negative C-rate)
        data.push([(baseTime + 0.01) / divisor, -scenario.chargeRate])
        data.push([(baseTime + cycleTime * 0.8) / divisor, -scenario.chargeRate])
        // Rest
        data.push([(baseTime + cycleTime * 0.81) / divisor, 0])
        data.push([(baseTime + cycleTime) / divisor, 0])
        // Charge (positive C-rate)
        data.push([(baseTime + cycleTime + 0.01) / divisor, scenario.chargeRate])
        data.push([(baseTime + cycleTime * 1.8) / divisor, scenario.chargeRate])
        // Rest
        data.push([(baseTime + cycleTime * 1.81) / divisor, 0])
        data.push([(baseTime + cycleTime * 2) / divisor, 0])
      }
      return data
    }

    const generateTempData = (): [number, number][] => {
      const data: [number, number][] = []
      const avgTemp = (scenario.tempMin + scenario.tempMax) / 2
      const tempSwing = (scenario.tempMax - scenario.tempMin) * 0.3 // Temperature varies during operation
      for (let i = 0; i < totalCycles; i++) {
        const baseTime = i * cycleTime * 2
        data.push([baseTime / divisor, avgTemp])
        // Temperature rises during discharge
        data.push([(baseTime + cycleTime * 0.4) / divisor, avgTemp + tempSwing])
        data.push([(baseTime + cycleTime * 0.8) / divisor, avgTemp + tempSwing * 0.8])
        // Cool down during rest
        data.push([(baseTime + cycleTime) / divisor, avgTemp])
        // Temperature rises during charge
        data.push([(baseTime + cycleTime * 1.4) / divisor, avgTemp + tempSwing * 0.6])
        data.push([(baseTime + cycleTime * 1.8) / divisor, avgTemp + tempSwing * 0.5])
        // Cool down
        data.push([(baseTime + cycleTime * 2) / divisor, avgTemp])
      }
      return data
    }

    const getChartData = () => {
      switch (spectrumType) {
        case 'SOC': return generateSOCData()
        case 'C-rate': return generateCRateData()
        case 'Temp': return generateTempData()
        default: return generateSOCData()
      }
    }

    const getYAxisConfig = () => {
      switch (spectrumType) {
        case 'SOC':
          return { name: 'SOC (%)', min: 0, max: 100, color: '#6ea8fe' }
        case 'C-rate':
          return { name: 'C-rate (C)', min: -Math.ceil(scenario.chargeRate * 1.2), max: Math.ceil(scenario.chargeRate * 1.2), color: '#3ddc97' }
        case 'Temp':
          return { name: '温度 (°C)', min: scenario.tempMin - 5, max: scenario.tempMax + 10, color: '#ffcc66' }
        default:
          return { name: 'SOC (%)', min: 0, max: 100, color: '#6ea8fe' }
      }
    }

    const yConfig = getYAxisConfig()
    const chartData = getChartData()

    return {
      backgroundColor: 'transparent',
      grid: { left: 55, right: 20, top: 40, bottom: 50 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,30,50,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff', fontSize: 11 },
        formatter: (params: any) => {
          const point = params[0]
          const unitLabel = spectrumType === 'SOC' ? '%' : spectrumType === 'C-rate' ? 'C' : '°C'
          return `时间: ${point.data[0].toFixed(1)} ${unit}<br/>${spectrumType}: ${point.data[1].toFixed(1)}${unitLabel}`
        }
      },
      xAxis: {
        type: 'value',
        name: `时间 (${unit})`,
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
      },
      yAxis: {
        type: 'value',
        name: yConfig.name,
        min: yConfig.min,
        max: yConfig.max,
        nameTextStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
        axisLine: { lineStyle: { color: yConfig.color } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
      },
      series: [{
        type: 'line',
        data: chartData,
        lineStyle: { color: yConfig.color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${yConfig.color}40` },
              { offset: 1, color: `${yConfig.color}08` }
            ]
          }
        },
        showSymbol: false,
        smooth: false
      }]
    }
  }, [scenario, spectrumType])

  // Process candidates when generated
  useEffect(() => {
    if (showCandidates) {
      const processed = DEMO_CELLS.map((c, idx) => ({
        ...c,
        displayScore: c.score,
        recommendLevel: (idx === 0 ? '推荐' : idx < 3 ? '备选' : '可用') as RecommendLevel,
        penalties: [],
        reason: ''
      }))
      const normalized = normalizeScoresForDisplay(processed)
      const withReasons = normalized.map(c => ({
        ...c,
        reason: generateReason(c)
      }))
      setCandidateCells(withReasons)
      if (withReasons.length > 0 && !selectedCellId) {
        setSelectedCellId(withReasons[0].id)
      }
      // Calculate coverage
      setCoverage(calculateCoverage(scenario))
    }
  }, [showCandidates, scenario])

  const selectedCell = candidateCells.find(c => c.id === selectedCellId)
  const displayedCells = candidateCells.slice(0, displayCount)

  // Generate constraints for selected cell
  const generateConstraints = (cell: CandidateCell | undefined): Constraint[] => {
    if (!cell) return []
    return [
      {
        type: cell.tempChargeMinC <= scenario.tempMin ? 'pass' : 'warning',
        label: '低温充电',
        detail: `电芯最低充电温度 ${cell.tempChargeMinC}°C ${cell.tempChargeMinC <= scenario.tempMin ? '满足' : '不满足'}工况要求 ${scenario.tempMin}°C`
      },
      {
        type: cell.maxDischargeCCont >= scenario.chargeRate ? 'pass' : 'fail',
        label: '倍率能力',
        detail: `电芯最大放电倍率 ${cell.maxDischargeCCont}C ${cell.maxDischargeCCont >= scenario.chargeRate ? '满足' : '不满足'}工况要求 ${scenario.chargeRate}C`
      },
      {
        type: cell.cycleLife80DoD25C >= 3000 ? 'pass' : cell.cycleLife80DoD25C >= 2000 ? 'warning' : 'fail',
        label: '循环寿命',
        detail: `电芯循环寿命 ${cell.cycleLife80DoD25C} 次 (80% DOD @25°C)`
      },
      {
        type: cell.chemistry === 'LFP' ? 'pass' : cell.safetyMatch >= 85 ? 'pass' : 'warning',
        label: '安全裕度',
        detail: cell.chemistry === 'LFP' ? 'LFP 电芯本征安全性高' : `NCM 安全裕度匹配 ${cell.safetyMatch}%`
      },
    ]
  }

  // Radar chart for selected cell
  const radarOption = selectedCell ? {
    backgroundColor: 'transparent',
    radar: {
      indicator: [
        { name: '寿命', max: 100 },
        { name: '功率', max: 100 },
        { name: '安全', max: 100 },
        { name: '成本', max: 100 },
        { name: '温度适应', max: 100 }
      ],
      axisName: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitArea: { areaStyle: { color: ['rgba(110,168,254,0.02)', 'rgba(110,168,254,0.05)'] } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [selectedCell.lifeMatch, selectedCell.powerMatch, selectedCell.safetyMatch, 85, 80],
        name: selectedCell.model,
        areaStyle: { color: 'rgba(110,168,254,0.3)' },
        lineStyle: { color: '#6ea8fe', width: 2 },
        itemStyle: { color: '#6ea8fe' }
      }]
    }]
  } : null

  // Table columns
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <span style={{ color: index === 0 ? '#3ddc97' : index < 3 ? '#6ea8fe' : 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
          #{index + 1}
        </span>
      )
    },
    {
      title: '电芯型号',
      dataIndex: 'model',
      key: 'model',
      render: (text: string, record: CandidateCell) => (
        <div>
          <div style={{ fontWeight: 500, color: '#fff' }}>{text}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{record.chemistry} · {record.capacityAh}Ah</div>
        </div>
      )
    },
    {
      title: '推荐等级',
      dataIndex: 'recommendLevel',
      key: 'recommendLevel',
      width: 80,
      render: (level: RecommendLevel) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          background: level === '推荐' ? 'rgba(61,220,151,0.15)' : level === '备选' ? 'rgba(110,168,254,0.15)' : 'rgba(255,255,255,0.08)',
          color: level === '推荐' ? '#3ddc97' : level === '备选' ? '#6ea8fe' : 'rgba(255,255,255,0.65)',
          border: `1px solid ${level === '推荐' ? 'rgba(61,220,151,0.3)' : level === '备选' ? 'rgba(110,168,254,0.3)' : 'rgba(255,255,255,0.14)'}`
        }}>
          {level}
        </span>
      )
    },
    {
      title: '综合得分',
      dataIndex: 'displayScore',
      key: 'displayScore',
      width: 100,
      render: (score: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={score}
            size="small"
            strokeColor={score >= 90 ? '#3ddc97' : score >= 80 ? '#6ea8fe' : '#ffcc66'}
            trailColor="rgba(255,255,255,0.1)"
            showInfo={false}
            style={{ width: 50 }}
          />
          <span style={{ fontWeight: 600, color: score >= 90 ? '#3ddc97' : score >= 80 ? '#6ea8fe' : '#ffcc66' }}>
            {score}
          </span>
        </div>
      )
    },
    {
      title: '匹配说明',
      dataIndex: 'reason',
      key: 'reason',
      render: (text: string) => <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{text}</span>
    }
  ]

  // Card/Panel styles
  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: 20,
    height: '100%',
    overflow: 'auto'
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.85)'
  }

  const isLowCoverage = coverage.level === 'low'

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(110,168,254,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RocketOutlined style={{ fontSize: 20, color: '#6ea8fe' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'rgba(255,255,255,0.92)' }}>
              Scenario → Cell 工况驱动选型
            </h2>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              输入应用工况参数，自动匹配推荐电芯
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Status Bar */}
      {showCandidates && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 20,
          borderRadius: 8,
          background: coverage.level === 'high' ? 'rgba(61,220,151,0.1)' : coverage.level === 'medium' ? 'rgba(255,204,102,0.1)' : 'rgba(255,107,107,0.1)',
          border: `1px solid ${coverage.level === 'high' ? 'rgba(61,220,151,0.3)' : coverage.level === 'medium' ? 'rgba(255,204,102,0.3)' : 'rgba(255,107,107,0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {coverage.level === 'high' ? (
              <CheckCircleOutlined style={{ fontSize: 18, color: '#3ddc97' }} />
            ) : coverage.level === 'medium' ? (
              <ExclamationCircleOutlined style={{ fontSize: 18, color: '#ffcc66' }} />
            ) : (
              <WarningOutlined style={{ fontSize: 18, color: '#ff6b6b' }} />
            )}
            <div>
              <span style={{
                fontWeight: 600,
                color: coverage.level === 'high' ? '#3ddc97' : coverage.level === 'medium' ? '#ffcc66' : '#ff6b6b'
              }}>
                数据覆盖度: {coverage.percentage}%
              </span>
              {coverage.missingItems.length > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {coverage.missingItems.join('；')}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {coverage.level === 'medium' && (
              <Button size="small" style={{ background: 'rgba(255,204,102,0.15)', border: '1px solid rgba(255,204,102,0.4)', color: '#ffcc66' }}>
                发起快速补测
              </Button>
            )}
            {coverage.level === 'low' && (
              <Link to={`/custom-eval/create?from=select&mode=scenario-to-cell&scenario=${encodeURIComponent(JSON.stringify(scenario))}`}>
                <Button type="primary" size="small" style={{ background: '#ff6b6b', borderColor: '#ff6b6b' }}>
                  申请定制评估报告
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Three-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: 20, minHeight: 'calc(100vh - 240px)' }}>
        {/* Left Column: Scenario Input */}
        <div style={panelStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#6ea8fe' }} />
            工况输入
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>工况类型</label>
            <Select
              value={scenario.type}
              onChange={(value) => setScenario({ ...scenario, type: value })}
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1a2438' }}
              options={[
                { value: 'fast_charging', label: '车用快充' },
                { value: 'energy_storage', label: '储能日循环' },
                { value: 'high_temp_storage', label: '高温存储' },
                { value: 'low_temp_operation', label: '低温运行' },
                { value: 'heavy_duty', label: '重载工况' }
              ]}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>温度范围 (°C)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <InputNumber value={scenario.tempMin} onChange={(v) => setScenario({ ...scenario, tempMin: v || -10 })} style={{ ...inputStyle, width: '100%' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>~</span>
              <InputNumber value={scenario.tempMax} onChange={(v) => setScenario({ ...scenario, tempMax: v || 45 })} style={{ ...inputStyle, width: '100%' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>SOC窗口 (%)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <InputNumber value={scenario.socMin} onChange={(v) => setScenario({ ...scenario, socMin: v || 10 })} style={{ ...inputStyle, width: '100%' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>~</span>
              <InputNumber value={scenario.socMax} onChange={(v) => setScenario({ ...scenario, socMax: v || 90 })} style={{ ...inputStyle, width: '100%' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              充电倍率: {scenario.chargeRate}C
            </label>
            <Slider min={0.5} max={5} step={0.5} value={scenario.chargeRate} onChange={(v) => setScenario({ ...scenario, chargeRate: v })} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>目标循环寿命 (次)</label>
            <Select
              value={3000}
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1a2438' }}
              options={[
                { value: 1500, label: '1,500 次' },
                { value: 2000, label: '2,000 次' },
                { value: 3000, label: '3,000 次' },
                { value: 5000, label: '5,000 次' },
                { value: 8000, label: '8,000 次' }
              ]}
            />
          </div>

          <Button
            type="primary"
            block
            onClick={() => setShowCandidates(true)}
            icon={<RocketOutlined />}
            style={{ height: 44, fontWeight: 500, background: '#6ea8fe', borderColor: '#6ea8fe', marginTop: 8 }}
          >
            生成候选电芯列表
          </Button>
        </div>

        {/* Center Column: Condition Spectrum / Candidate List */}
        <div style={panelStyle}>
          {!showCandidates ? (
            /* Phase A: Condition Spectrum Preview (before generating candidates) */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LineChartOutlined style={{ color: '#6ea8fe' }} />
                  工况谱（Condition Spectrum）
                </div>
                <Segmented
                  size="small"
                  value={spectrumType}
                  onChange={(v) => setSpectrumType(v as 'SOC' | 'C-rate' | 'Temp')}
                  options={[
                    { label: 'SOC', value: 'SOC' },
                    { label: 'C-rate', value: 'C-rate' },
                    { label: '温度', value: 'Temp' }
                  ]}
                />
              </div>

              {/* Spectrum Chart */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <ReactECharts option={spectrumChartOption} style={{ height: 240 }} />
              </div>

              {/* Condition Summary Cards */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>工况摘要</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {/* Temperature Range */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(255,204,102,0.08)',
                    border: '1px solid rgba(255,204,102,0.2)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>温度范围</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#ffcc66' }}>
                      {scenario.tempMin} ~ {scenario.tempMax}°C
                    </div>
                  </div>

                  {/* C-rate Range */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(61,220,151,0.08)',
                    border: '1px solid rgba(61,220,151,0.2)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>C-rate 范围</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#3ddc97' }}>
                      0.1C ~ {scenario.chargeRate}C
                    </div>
                  </div>

                  {/* SOC Window */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(110,168,254,0.08)',
                    border: '1px solid rgba(110,168,254,0.2)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>SOC 窗口</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#6ea8fe' }}>
                      {scenario.socMin}% ~ {scenario.socMax}%
                    </div>
                  </div>

                  {/* Target Cycle Life */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>目标寿命</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                      {targetCycleLife.toLocaleString()} 次
                    </div>
                  </div>
                </div>
              </div>

              {/* Hint Text */}
              <div style={{
                padding: 16,
                background: 'rgba(110,168,254,0.08)',
                border: '1px solid rgba(110,168,254,0.2)',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  参数已就绪，点击左侧「生成候选电芯列表」开始匹配
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  系统将根据上述工况谱从电芯数据库中筛选最佳候选
                </div>
              </div>
            </>
          ) : (
            /* Phase B: Candidate List (after generating) */
            <>
              {/* Condensed Spectrum Preview */}
              <div style={{
                padding: 12,
                marginBottom: 16,
                background: 'rgba(110,168,254,0.06)',
                border: '1px solid rgba(110,168,254,0.15)',
                borderRadius: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LineChartOutlined style={{ color: '#6ea8fe' }} />
                    工况谱预览
                  </div>
                  <Segmented
                    size="small"
                    value={spectrumType}
                    onChange={(v) => setSpectrumType(v as 'SOC' | 'C-rate' | 'Temp')}
                    options={[
                      { label: 'SOC', value: 'SOC' },
                      { label: 'C-rate', value: 'C-rate' },
                      { label: '温度', value: 'Temp' }
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {/* Mini Chart */}
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: 8 }}>
                    <ReactECharts
                      option={{
                        ...spectrumChartOption,
                        grid: { left: 35, right: 10, top: 15, bottom: 25 },
                        xAxis: { ...spectrumChartOption.xAxis, nameGap: 18, axisLabel: { ...spectrumChartOption.xAxis.axisLabel, fontSize: 9 } },
                        yAxis: { ...spectrumChartOption.yAxis, axisLabel: { ...spectrumChartOption.yAxis.axisLabel, fontSize: 9 } }
                      }}
                      style={{ height: 100 }}
                    />
                  </div>
                  {/* Mini Summary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>温度:</span>
                      <span style={{ color: '#ffcc66' }}>{scenario.tempMin}~{scenario.tempMax}°C</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>倍率:</span>
                      <span style={{ color: '#3ddc97' }}>0.1~{scenario.chargeRate}C</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>SOC:</span>
                      <span style={{ color: '#6ea8fe' }}>{scenario.socMin}~{scenario.socMax}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>寿命:</span>
                      <span style={{ color: 'rgba(255,255,255,0.85)' }}>{targetCycleLife.toLocaleString()}次</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate List Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  候选电芯列表
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    background: 'rgba(110,168,254,0.15)',
                    color: '#6ea8fe',
                    border: '1px solid rgba(110,168,254,0.3)'
                  }}>
                    Top {displayCount}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    size="small"
                    onClick={() => setDisplayCount(5)}
                    style={{
                      background: displayCount === 5 ? 'rgba(110,168,254,0.2)' : 'transparent',
                      border: `1px solid ${displayCount === 5 ? 'rgba(110,168,254,0.5)' : 'rgba(255,255,255,0.14)'}`,
                      color: displayCount === 5 ? '#6ea8fe' : 'rgba(255,255,255,0.65)'
                    }}
                  >
                    Top 5
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setDisplayCount(10)}
                    style={{
                      background: displayCount === 10 ? 'rgba(110,168,254,0.2)' : 'transparent',
                      border: `1px solid ${displayCount === 10 ? 'rgba(110,168,254,0.5)' : 'rgba(255,255,255,0.14)'}`,
                      color: displayCount === 10 ? '#6ea8fe' : 'rgba(255,255,255,0.65)'
                    }}
                  >
                    Top 10
                  </Button>
                </div>
              </div>

              {/* Candidate Table */}
              <Table
                dataSource={displayedCells}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
                onRow={(record) => ({
                  onClick: () => setSelectedCellId(record.id),
                  style: {
                    cursor: 'pointer',
                    background: selectedCellId === record.id ? 'rgba(110,168,254,0.1)' : 'transparent'
                  }
                })}
              />

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <Tooltip title={isLowCoverage ? '数据覆盖度不足，无法导出' : ''}>
                  <Button
                    block
                    icon={<FileTextOutlined />}
                    disabled={isLowCoverage}
                    style={{
                      background: isLowCoverage ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      color: isLowCoverage ? 'rgba(255,255,255,0.3)' : '#fff'
                    }}
                  >
                    导出 PDF 选型报告
                  </Button>
                </Tooltip>
                <Tooltip title={isLowCoverage ? '数据覆盖度不足，无法导出' : ''}>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    disabled={isLowCoverage}
                    style={{
                      background: isLowCoverage ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      color: isLowCoverage ? 'rgba(255,255,255,0.3)' : '#fff'
                    }}
                  >
                    导出 CSV 候选清单
                  </Button>
                </Tooltip>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Explanation & Constraints */}
        <div style={panelStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <InfoCircleOutlined style={{ color: '#6ea8fe' }} />
            解释与约束
          </div>

          {!selectedCell ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingTop: 40 }}>
              选择一个候选电芯查看详情
            </div>
          ) : (
            <>
              {/* Selected Cell Info */}
              <div style={{
                padding: 12,
                marginBottom: 16,
                borderRadius: 8,
                background: 'rgba(110,168,254,0.1)',
                border: '1px solid rgba(110,168,254,0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{selectedCell.model}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{selectedCell.chemistry} · {selectedCell.capacityAh}Ah</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: selectedCell.displayScore >= 90 ? '#3ddc97' : '#6ea8fe' }}>
                      {selectedCell.displayScore}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>综合得分</div>
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              {radarOption && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>能力雷达</div>
                  <ReactECharts option={radarOption} style={{ height: 180 }} />
                </div>
              )}

              {/* Constraints */}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>约束校验</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {generateConstraints(selectedCell).map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: c.type === 'pass' ? 'rgba(61,220,151,0.08)' : c.type === 'warning' ? 'rgba(255,204,102,0.08)' : 'rgba(255,107,107,0.08)',
                      border: `1px solid ${c.type === 'pass' ? 'rgba(61,220,151,0.25)' : c.type === 'warning' ? 'rgba(255,204,102,0.25)' : 'rgba(255,107,107,0.25)'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      {c.type === 'pass' ? (
                        <CheckCircleOutlined style={{ color: '#3ddc97', fontSize: 12 }} />
                      ) : c.type === 'warning' ? (
                        <ExclamationCircleOutlined style={{ color: '#ffcc66', fontSize: 12 }} />
                      ) : (
                        <WarningOutlined style={{ color: '#ff6b6b', fontSize: 12 }} />
                      )}
                      <span style={{ fontSize: 12, fontWeight: 500, color: c.type === 'pass' ? '#3ddc97' : c.type === 'warning' ? '#ffcc66' : '#ff6b6b' }}>
                        {c.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', paddingLeft: 18 }}>
                      {c.detail}
                    </div>
                  </div>
                ))}
              </div>

              {/* Match Reason */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>匹配原因</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                  {selectedCell.reason}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
