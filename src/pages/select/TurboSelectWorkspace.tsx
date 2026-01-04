import { useState, useEffect } from 'react'
import { Select, InputNumber, Slider, Button, Tooltip } from 'antd'
import { RocketOutlined, ExperimentOutlined, InfoCircleOutlined, DownloadOutlined, SwapRightOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useSelect } from '../../contexts/SelectContext'

// ==================== Types ====================
type RiskLevel = 'low' | 'medium' | 'high'
type RecommendLevel = '推荐' | '备选' | '可用'

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

// ==================== Demo Data ====================
const DEMO_CELLS: Omit<CandidateCell, 'displayScore' | 'recommendLevel' | 'penalties'>[] = [
  { id: 'cell-1', model: 'LFP-280Ah', chemistry: 'LFP', capacityAh: 280, maxDischargeCCont: 1.0, cycleLife80DoD25C: 6000, tempDischargeMinC: -20, tempDischargeMaxC: 55, tempChargeMinC: 0, tempChargeMaxC: 45, score: 95, risk: 'low', lifeMatch: 98, powerMatch: 92, safetyMatch: 95, reason: '' },
  { id: 'cell-2', model: 'NCM-156Ah', chemistry: 'NCM', capacityAh: 156, maxDischargeCCont: 2.0, cycleLife80DoD25C: 3000, tempDischargeMinC: -20, tempDischargeMaxC: 60, tempChargeMinC: 0, tempChargeMaxC: 45, score: 91, risk: 'low', lifeMatch: 85, powerMatch: 96, safetyMatch: 90, reason: '' },
  { id: 'cell-3', model: 'LFP-314Ah', chemistry: 'LFP', capacityAh: 314, maxDischargeCCont: 0.5, cycleLife80DoD25C: 8000, tempDischargeMinC: -20, tempDischargeMaxC: 55, tempChargeMinC: 0, tempChargeMaxC: 45, score: 88, risk: 'medium', lifeMatch: 95, powerMatch: 78, safetyMatch: 92, reason: '' },
  { id: 'cell-4', model: 'NCM-117Ah', chemistry: 'NCM', capacityAh: 117, maxDischargeCCont: 3.0, cycleLife80DoD25C: 2500, tempDischargeMinC: -30, tempDischargeMaxC: 60, tempChargeMinC: -10, tempChargeMaxC: 45, score: 85, risk: 'medium', lifeMatch: 72, powerMatch: 98, safetyMatch: 85, reason: '' },
  { id: 'cell-5', model: 'LFP-230Ah', chemistry: 'LFP', capacityAh: 230, maxDischargeCCont: 1.5, cycleLife80DoD25C: 5000, tempDischargeMinC: -20, tempDischargeMaxC: 55, tempChargeMinC: 0, tempChargeMaxC: 45, score: 82, risk: 'medium', lifeMatch: 88, powerMatch: 85, safetyMatch: 88, reason: '' },
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
    const targetMin = 78
    const targetMax = 97
    return cells.map((c, index) => {
      let displayScore: number
      if (maxScore === minScore) {
        displayScore = targetMax - index * 4
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

// ==================== Component ====================
export default function TurboSelectWorkspace() {
  const { scenario, setScenario } = useSelect()
  const [activeMode, setActiveMode] = useState<'scenario-to-cell' | 'cell-to-scenario'>('scenario-to-cell')
  const [candidateCells, setCandidateCells] = useState<CandidateCell[]>([])
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [showCandidates, setShowCandidates] = useState(false)

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
    }
  }, [showCandidates])

  // Handle cell selection from left panel → sync to right panel
  const handleCellSelect = (cellId: string) => {
    setSelectedCellId(cellId)
  }

  // Generate SOA heatmap data
  const generateHeatmapData = () => {
    const data: [number, number, number][] = []
    const socSteps = 10
    const tempSteps = 8
    for (let s = 0; s < socSteps; s++) {
      for (let t = 0; t < tempSteps; t++) {
        const soc = s * 10 + 5
        const temp = t * 10 - 10
        // Simple demo calculation
        let iMax = 3.0
        if (temp < 0) iMax *= 0.5
        if (temp > 40) iMax *= 0.8
        if (soc > 80 || soc < 20) iMax *= 0.7
        iMax = Math.max(0.3, iMax)
        data.push([s, t, Math.round(iMax * 10) / 10])
      }
    }
    return data
  }

  const heatmapOption = {
    title: { text: 'SOA 安全边界热力图', left: 'center', textStyle: { color: '#fff', fontSize: 14 } },
    tooltip: {
      formatter: (params: any) => `SOC: ${params.data[0] * 10 + 5}%<br/>温度: ${params.data[1] * 10 - 10}°C<br/>Imax: ${params.data[2]}C`
    },
    grid: { left: 60, right: 80, top: 60, bottom: 60 },
    xAxis: { type: 'category', data: Array.from({ length: 10 }, (_, i) => `${i * 10 + 5}%`), name: 'SOC', axisLabel: { color: '#90caf9' }, axisLine: { lineStyle: { color: '#1e88e5' } } },
    yAxis: { type: 'category', data: Array.from({ length: 8 }, (_, i) => `${i * 10 - 10}°C`), name: '温度', axisLabel: { color: '#90caf9' }, axisLine: { lineStyle: { color: '#1e88e5' } } },
    visualMap: {
      min: 0.3, max: 3.0,
      inRange: { color: ['#4caf50', '#ffeb3b', '#ff9800', '#f44336'] },
      right: 10, top: 'center',
      textStyle: { color: '#90caf9' }
    },
    series: [{
      type: 'heatmap',
      data: generateHeatmapData(),
      itemStyle: { borderRadius: 4 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  }

  const selectedCell = candidateCells.find(c => c.id === selectedCellId)

  // Card style
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.85)'
  }

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header with Mode Tabs */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: 'rgba(255,255,255,0.92)' }}>
          Turbo-Select 选型工作台
        </h2>
        <div style={{ display: 'flex', gap: 8, padding: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, width: 'fit-content', border: '1px solid rgba(255,255,255,0.14)' }}>
          <button
            onClick={() => setActiveMode('scenario-to-cell')}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: activeMode === 'scenario-to-cell' ? '1px solid rgba(110,168,254,0.4)' : '1px solid transparent',
              background: activeMode === 'scenario-to-cell' ? 'rgba(110,168,254,0.18)' : 'transparent',
              color: activeMode === 'scenario-to-cell' ? '#fff' : 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <RocketOutlined />
            Scenario → Cell 选型
          </button>
          <button
            onClick={() => setActiveMode('cell-to-scenario')}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: activeMode === 'cell-to-scenario' ? '1px solid rgba(110,168,254,0.4)' : '1px solid transparent',
              background: activeMode === 'cell-to-scenario' ? 'rgba(110,168,254,0.18)' : 'transparent',
              color: activeMode === 'cell-to-scenario' ? '#fff' : 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <ExperimentOutlined />
            Cell → Scenario 边界评估
          </button>
        </div>
      </div>

      {/* Dual Entry Cards - 1:1 Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left Card: Scenario → Cell */}
        <div style={{ ...cardStyle, opacity: activeMode === 'scenario-to-cell' ? 1 : 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(110,168,254,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RocketOutlined style={{ fontSize: 20, color: '#6ea8fe' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>工况驱动选型</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>输入应用工况 → 生成候选电芯</div>
            </div>
          </div>

          {/* Scenario Inputs */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>工况类型</label>
            <Select
              value={scenario.type}
              onChange={(value) => setScenario({ ...scenario, type: value })}
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1a2438' }}
              options={[
                { value: 'fast_charging', label: '车用快充' },
                { value: 'energy_storage', label: '储能日循环' },
                { value: 'high_temp_storage', label: '高温存储' }
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>温度范围 (°C)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <InputNumber value={scenario.tempMin} onChange={(v) => setScenario({ ...scenario, tempMin: v || -10 })} style={{ ...inputStyle, width: 70 }} />
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>~</span>
                <InputNumber value={scenario.tempMax} onChange={(v) => setScenario({ ...scenario, tempMax: v || 45 })} style={{ ...inputStyle, width: 70 }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>SOC窗口 (%)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <InputNumber value={scenario.socMin} onChange={(v) => setScenario({ ...scenario, socMin: v || 10 })} style={{ ...inputStyle, width: 70 }} />
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>~</span>
                <InputNumber value={scenario.socMax} onChange={(v) => setScenario({ ...scenario, socMax: v || 90 })} style={{ ...inputStyle, width: 70 }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>充电倍率: {scenario.chargeRate}C</label>
            <Slider min={0.5} max={5} step={0.5} value={scenario.chargeRate} onChange={(v) => setScenario({ ...scenario, chargeRate: v })} />
          </div>

          <Button
            type="primary"
            block
            onClick={() => setShowCandidates(true)}
            style={{ height: 44, fontWeight: 500, background: '#6ea8fe', borderColor: '#6ea8fe' }}
          >
            生成候选电芯列表
          </Button>

          {/* Candidate List */}
          {showCandidates && candidateCells.length > 0 && (
            <div style={{ marginTop: 20, maxHeight: 300, overflow: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Top 5 候选电芯</div>
              {candidateCells.map((cell, idx) => (
                <div
                  key={cell.id}
                  onClick={() => handleCellSelect(cell.id)}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    background: selectedCellId === cell.id ? 'rgba(110,168,254,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selectedCellId === cell.id ? '1px solid rgba(110,168,254,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#6ea8fe', fontWeight: 600 }}>#{idx + 1}</span>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{cell.model}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        background: cell.recommendLevel === '推荐' ? 'rgba(61,220,151,0.15)' : cell.recommendLevel === '备选' ? 'rgba(110,168,254,0.15)' : 'rgba(255,255,255,0.08)',
                        color: cell.recommendLevel === '推荐' ? '#3ddc97' : cell.recommendLevel === '备选' ? '#6ea8fe' : 'rgba(255,255,255,0.65)',
                        border: `1px solid ${cell.recommendLevel === '推荐' ? 'rgba(61,220,151,0.3)' : cell.recommendLevel === '备选' ? 'rgba(110,168,254,0.3)' : 'rgba(255,255,255,0.14)'}`
                      }}>
                        {cell.recommendLevel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: cell.displayScore >= 90 ? '#3ddc97' : cell.displayScore >= 80 ? '#6ea8fe' : '#ffcc66' }}>
                        {cell.displayScore}
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>分</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{cell.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Card: Cell → Scenario */}
        <div style={{ ...cardStyle, opacity: activeMode === 'cell-to-scenario' ? 1 : 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(61,220,151,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExperimentOutlined style={{ fontSize: 20, color: '#3ddc97' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>电芯驱动边界评估</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>选择电芯 → 输出 SOA/策略</div>
            </div>
          </div>

          {/* Cell Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              选择电芯型号
              {selectedCellId && candidateCells.length > 0 && (
                <span style={{ marginLeft: 8, color: '#3ddc97', fontSize: 11 }}>
                  <SwapRightOutlined /> 来自左侧候选
                </span>
              )}
            </label>
            <Select
              value={selectedCellId || undefined}
              onChange={(value) => setSelectedCellId(value)}
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1a2438' }}
              placeholder="选择电芯型号"
              options={[
                ...candidateCells.map(c => ({ value: c.id, label: `${c.model} (${c.chemistry})` })),
                { value: 'manual-1', label: 'LFP-280Ah (手动输入)' },
                { value: 'manual-2', label: 'NCM-200Ah (手动输入)' }
              ]}
            />
          </div>

          {/* Selected Cell Info */}
          {selectedCell && (
            <div style={{
              padding: 12,
              marginBottom: 16,
              borderRadius: 8,
              background: 'rgba(61,220,151,0.1)',
              border: '1px solid rgba(61,220,151,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#90caf9', fontSize: 12 }}>当前电芯：</span>
                  <span style={{ color: '#fff', fontWeight: 600, marginLeft: 4 }}>{selectedCell.model}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#3ddc97' }}>{selectedCell.displayScore}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>分</span>
                </div>
              </div>
            </div>
          )}

          {/* SOA Heatmap */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>SOA 安全边界</span>
              <Tooltip title="绿色=安全，黄色=警告，红色=禁止">
                <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.5)', cursor: 'help' }} />
              </Tooltip>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 8 }}>
              <ReactECharts option={heatmapOption} style={{ height: 280 }} />
            </div>
          </div>

          {/* SOC Window Recommendation */}
          <div style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            background: 'rgba(110,168,254,0.1)',
            border: '1px solid rgba(110,168,254,0.3)'
          }}>
            <div style={{ fontSize: 12, color: '#6ea8fe', marginBottom: 4 }}>推荐 SOC 窗口</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>15% ~ 85%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>基于温度-SOC-倍率三维约束计算</div>
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              block
              icon={<DownloadOutlined />}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff' }}
            >
              导出限流策略表
            </Button>
            <Button
              type="primary"
              block
              style={{ background: '#3ddc97', borderColor: '#3ddc97', color: '#0b1220' }}
            >
              生成BMS配置
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Links */}
      <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <a href="#" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>SOA边界详情</a>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
        <a href="#" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>运行策略表</a>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
        <a href="#" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>导出完整报告</a>
      </div>
    </div>
  )
}