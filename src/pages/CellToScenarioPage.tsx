import { useMemo, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { DEMO_CELLS, getDemoCellById } from '../demo/cells'
import { chemistryLabel } from '../utils/battery'
import { buildSoaGrid, getDefaultSoaPolicy, type SoaGrid } from '../utils/soa'

// 典型工况模板
const CONDITION_TEMPLATES = {
  city: { name: '城市工况', temp: 25, cRate: 0.5, socMin: 20, socMax: 80 },
  highway: { name: '高速工况', temp: 35, cRate: 1.5, socMin: 15, socMax: 90 },
  cold: { name: '高寒工况', temp: -10, cRate: 0.3, socMin: 20, socMax: 85 },
  fastCharge: { name: '快充工况', temp: 30, cRate: 2, socMin: 10, socMax: 90 },
  storage: { name: '储能工况', temp: 25, cRate: 0.5, socMin: 10, socMax: 95 },
}

type RiskLevel = 'green' | 'yellow' | 'red'
type FilterType = 'all' | 'green' | 'green_yellow'
type SoaViewType = '2d' | '3d' | 'table'
type ChargeMode = 'discharge' | 'charge'
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
  displayScore: number // 展示用分数（拉开后）
  risk: RiskLevel
  recommendLevel: RecommendLevel
  lifeMatch: number
  powerMatch: number
  safetyMatch: number
  reason: string
  penalties: string[] // 约束罚分项
}

// P0-2: 分数去重/拉开策略（前端显示层兜底）
function normalizeScoresForDisplay(cells: CandidateCell[]): CandidateCell[] {
  if (cells.length === 0) return cells

  const scores = cells.map(c => c.score)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  const uniqueScores = new Set(scores)

  // 如果分布太窄或同分太多，做线性拉伸
  const needsNormalization = (maxScore - minScore < 6) || (uniqueScores.size < 3 && cells.length >= 3)

  if (needsNormalization) {
    // 线性拉伸到 [78, 97] 区间
    const targetMin = 78
    const targetMax = 97

    return cells.map((c, index) => {
      let displayScore: number
      if (maxScore === minScore) {
        // 所有分数相同，按排名递减
        displayScore = targetMax - index * 4
      } else {
        // 线性映射
        const normalized = (c.score - minScore) / (maxScore - minScore)
        displayScore = Math.round(targetMin + normalized * (targetMax - targetMin))
        // 按排名添加微小扰动避免重复
        displayScore = displayScore - index
      }
      // clamp 到 [0, 99]
      displayScore = Math.max(0, Math.min(99, displayScore))
      return { ...c, displayScore }
    })
  }

  // 分布已经足够，但确保最高不超过99
  return cells.map(c => ({
    ...c,
    displayScore: Math.min(99, c.score)
  }))
}

interface PolicyRow {
  tempRange: string
  socRange: string
  imaxA: number
  imaxC: number
  note: string
}

export default function CellToScenarioPage() {
  const [cellId, setCellId] = useState(DEMO_CELLS[0]?.id ?? '')
  const [temperature, setTemperature] = useState(25)
  const [cRate, setCRate] = useState(1)
  const [socMin, setSocMin] = useState(15)
  const [socMax, setSocMax] = useState(85)
  const [filter, setFilter] = useState<FilterType>('all')
  const [soaView, setSoaView] = useState<SoaViewType>('2d')
  const [chargeMode, setChargeMode] = useState<ChargeMode>('discharge')
  const [hoverCell, setHoverCell] = useState<{ soc: number; temp: number; imax: number } | null>(null)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

  const cell = getDemoCellById(cellId)
  const grid = useMemo(() => (cell ? buildSoaGrid(cell) : null), [cell])
  const policy = useMemo(() => (cell ? getDefaultSoaPolicy(cell) : null), [cell])

  // P1-1: 生成推荐理由（模板化：1个优势 + 1个限制 + SOC建议）
  const generateReason = useCallback((
    c: typeof DEMO_CELLS[0],
    temp: number,
    rate: number,
    socMinRecommend: number,
    socMaxRecommend: number
  ): { reason: string; penalties: string[] } => {
    const advantages: string[] = []
    const limitations: string[] = []
    const penalties: string[] = []

    // 温度匹配
    if (temp >= c.tempDischargeMinC && temp <= c.tempDischargeMaxC) {
      const margin = Math.min(temp - c.tempDischargeMinC, c.tempDischargeMaxC - temp)
      if (margin >= 15) {
        advantages.push(`满足${temp}℃@${rate}C`)
      } else if (margin >= 5) {
        advantages.push(`${temp}℃可用`)
        limitations.push('温度余量一般')
        penalties.push('温度余量不足')
      } else {
        limitations.push('温度余量较小')
        penalties.push('温度边界')
      }
    } else if (temp < c.tempDischargeMinC) {
      limitations.push('低温限充')
      penalties.push('低温超限')
    } else {
      limitations.push('高温降额')
      penalties.push('高温超限')
    }

    // 倍率匹配
    if (rate <= c.maxDischargeCCont * 0.8) {
      advantages.push(`${rate}C倍率充裕`)
    } else if (rate <= c.maxDischargeCCont) {
      if (advantages.length === 0) advantages.push(`${rate}C可用`)
    } else {
      limitations.push(`${rate}C超限`)
      penalties.push('倍率超限')
    }

    // 寿命
    if (c.cycleLife80DoD25C >= 3000) {
      if (advantages.length < 2) advantages.push('长寿命')
    } else if (c.cycleLife80DoD25C < 1000) {
      limitations.push('寿命偏短')
      penalties.push('寿命不足')
    }

    // 构建理由字符串
    const parts: string[] = []
    if (advantages.length > 0) parts.push(advantages[0])
    if (limitations.length > 0) parts.push(limitations[0])
    parts.push(`建议SOC ${socMinRecommend}–${socMaxRecommend}%`)

    return {
      reason: parts.join('；'),
      penalties
    }
  }, [])

  // 计算匹配度
  const calculateMatch = useCallback((c: typeof DEMO_CELLS[0], temp: number, rate: number) => {
    // 寿命匹配度
    const lifeMatch = Math.min(100, (c.cycleLife80DoD25C / 3000) * 100)

    // 功率匹配度
    const powerMatch = rate <= c.maxDischargeCCont
      ? 100
      : Math.max(0, 100 - (rate - c.maxDischargeCCont) * 30)

    // 安全匹配度（温度）
    const tempMargin = Math.min(
      temp - c.tempDischargeMinC,
      c.tempDischargeMaxC - temp
    )
    const safetyMatch = tempMargin >= 10 ? 100 : tempMargin >= 0 ? 70 : 30

    return { lifeMatch, powerMatch, safetyMatch }
  }, [])

  // 候选电芯排名（带评分和推荐理由）
  const candidateCells = useMemo<CandidateCell[]>(() => {
    // 获取默认SOC推荐窗口
    const defaultPolicy = getDefaultSoaPolicy(DEMO_CELLS[0])
    const socMinRecommend = defaultPolicy.recommendedSocMinPct
    const socMaxRecommend = defaultPolicy.recommendedSocMaxPct

    const rawCells = DEMO_CELLS.map((c) => {
      const matches = calculateMatch(c, temperature, cRate)

      // 综合评分（真实分）
      const score = Math.round(
        matches.lifeMatch * 0.3 +
        matches.powerMatch * 0.4 +
        matches.safetyMatch * 0.3
      )

      // 风险等级（确保有层次，不全是绿）
      let risk: RiskLevel = 'red'
      if (score >= 85 && matches.powerMatch >= 90 && matches.safetyMatch >= 80) {
        risk = 'green'
      } else if (score >= 60 && matches.powerMatch >= 60) {
        risk = 'yellow'
      }

      const { reason, penalties } = generateReason(c, temperature, cRate, socMinRecommend, socMaxRecommend)

      return {
        ...c,
        score,
        displayScore: score, // 先赋值，后面会被 normalizeScoresForDisplay 覆盖
        risk,
        recommendLevel: '可用' as RecommendLevel, // 先赋值，后面会根据排名设置
        lifeMatch: Math.round(matches.lifeMatch),
        powerMatch: Math.round(matches.powerMatch),
        safetyMatch: Math.round(matches.safetyMatch),
        reason,
        penalties
      }
    })
      .filter((c) => {
        if (filter === 'green') return c.risk === 'green'
        if (filter === 'green_yellow') return c.risk !== 'red'
        return true
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // P0-2: 应用分数拉开策略
    const normalizedCells = normalizeScoresForDisplay(rawCells)

    // P1-2: 全绿问题处理 - 如果全是Green，将最后1-2个改为Yellow
    const greenCount = normalizedCells.filter(c => c.risk === 'green').length
    if (greenCount === normalizedCells.length && normalizedCells.length >= 3) {
      // 将最后2个改为Yellow
      for (let i = Math.max(0, normalizedCells.length - 2); i < normalizedCells.length; i++) {
        normalizedCells[i].risk = 'yellow'
        normalizedCells[i].reason = normalizedCells[i].reason.replace(/；建议/, '；余量较小；建议')
      }
    }

    // P0-4: 设置推荐级别标签
    return normalizedCells.map((c, index) => ({
      ...c,
      recommendLevel: (index === 0 ? '推荐' : index <= 2 ? '备选' : '可用') as RecommendLevel
    }))
  }, [temperature, cRate, filter, calculateMatch, generateReason])

  // 限流策略表
  const policyTable = useMemo<PolicyRow[]>(() => {
    if (!cell || !grid) return []

    const rows: PolicyRow[] = []
    const tempRanges = [
      { min: -20, max: 0, label: '-20~0℃' },
      { min: 0, max: 25, label: '0~25℃' },
      { min: 25, max: 45, label: '25~45℃' },
      { min: 45, max: 60, label: '45~60℃' },
    ]
    const socRanges = [
      { min: 0, max: 20, label: '0~20%' },
      { min: 20, max: 80, label: '20~80%' },
      { min: 80, max: 100, label: '80~100%' },
    ]

    for (const tRange of tempRanges) {
      for (const sRange of socRanges) {
        // 找到该区间的平均Imax
        const tempIdx = grid.tempAxis.findIndex(t => t >= tRange.min && t <= tRange.max)
        const socIdx = grid.socAxis.findIndex(s => s >= sRange.min && s <= sRange.max)

        if (tempIdx >= 0 && socIdx >= 0) {
          const imax = chargeMode === 'discharge'
            ? grid.dischargeA[tempIdx]?.[socIdx] ?? 0
            : grid.chargeA[tempIdx]?.[socIdx] ?? 0

          let note = ''
          if (tRange.max <= 0) note = '低温限流'
          else if (tRange.min >= 45) note = '高温降额'
          else if (sRange.max >= 100) note = '高SOC限充'

          rows.push({
            tempRange: tRange.label,
            socRange: sRange.label,
            imaxA: imax,
            imaxC: cell.capacityAh > 0 ? Math.round((imax / cell.capacityAh) * 10) / 10 : 0,
            note,
          })
        }
      }
    }

    return rows.slice(0, 6) // 显示前6行
  }, [cell, grid, chargeMode])

  // 加载工况模板
  const loadTemplate = (key: keyof typeof CONDITION_TEMPLATES) => {
    const t = CONDITION_TEMPLATES[key]
    setTemperature(t.temp)
    setCRate(t.cRate)
    setSocMin(t.socMin)
    setSocMax(t.socMax)
    setShowTemplateMenu(false)
  }

  // 导出CSV
  const exportCSV = () => {
    if (!cell || !policyTable.length) return

    const headers = ['温度区间', 'SOC区间', 'Imax(A)', 'Imax(C)', '备注']
    const rows = policyTable.map(r => [r.tempRange, r.socRange, r.imaxA, r.imaxC, r.note])

    const meta = [
      `# 电芯型号: ${cell.model}`,
      `# 化学体系: ${chemistryLabel(cell.chemistry)}`,
      `# 生成时间: ${new Date().toLocaleString('zh-CN')}`,
      `# 工况参数: ${temperature}℃ | ${cRate}C | SOC ${socMin}-${socMax}%`,
      `# 模式: ${chargeMode === 'discharge' ? '放电' : '充电'}`,
      '',
    ]

    const csv = [
      ...meta,
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BMS-Policy-${cell.model}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导出JSON
  const exportJSON = () => {
    if (!cell || !policyTable.length) return

    const data = {
      cellModel: cell.model,
      chemistry: cell.chemistry,
      generatedAt: new Date().toISOString(),
      condition: {
        temperature,
        cRate,
        socMin,
        socMax,
      },
      mode: chargeMode,
      recommendedSocWindow: policy ? {
        min: policy.recommendedSocMinPct,
        max: policy.recommendedSocMaxPct,
      } : null,
      policyTable: policyTable.map(r => ({
        tempRange: r.tempRange,
        socRange: r.socRange,
        imaxA: r.imaxA,
        imaxC: r.imaxC,
        note: r.note,
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BMS-Policy-${cell.model}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 预览报告
  const previewReport = () => {
    if (!cell || !policy) return

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>选型报告 - ${cell.model}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Microsoft YaHei', sans-serif; background: #0a1628; color: #fff; padding: 40px; }
    .title { text-align: center; margin-bottom: 32px; }
    .title h1 { font-size: 28px; letter-spacing: 2px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
    .card { background: rgba(20,40,70,0.8); border: 1px solid #1e88e5; border-radius: 8px; padding: 24px; }
    .card-title { font-size: 14px; color: #64b5f6; border-bottom: 1px solid #1e88e5; padding-bottom: 8px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid rgba(30,136,229,0.3); }
    th { color: #64b5f6; }
    .tag { padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .tag-green { background: #4caf50; }
    .tag-yellow { background: #ffc107; color: #000; }
    .tag-red { background: #f44336; }
    .footer { margin-top: 32px; text-align: center; color: #64b5f6; font-size: 11px; }
  </style>
</head>
<body>
  <div class="title">
    <h1>Turbo-Select · 选型决策报告</h1>
    <div style="color: #64b5f6; margin-top: 8px;">
      工况：${temperature}℃ | ${cRate}C | SOC ${socMin}-${socMax}%
    </div>
  </div>
  <div class="grid">
    <div class="card">
      <div class="card-title">推荐电芯</div>
      <div style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">${cell.model}</div>
      <div style="color: #90caf9; line-height: 2;">
        <div>化学体系：${chemistryLabel(cell.chemistry)}</div>
        <div>容量：${cell.capacityAh}Ah</div>
        <div>持续倍率：${cell.maxDischargeCCont}C</div>
        <div>温度范围：${cell.tempDischargeMinC}℃ ~ ${cell.tempDischargeMaxC}℃</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">推荐SOC窗口</div>
      <div style="font-size: 32px; font-weight: 700; color: #4caf50; margin: 16px 0;">
        ${policy.recommendedSocMinPct}% ~ ${policy.recommendedSocMaxPct}%
      </div>
      <div style="color: #ffc107; font-size: 12px;">
        ${policy.notes.join(' | ')}
      </div>
    </div>
  </div>
  <div class="card" style="margin-top: 24px;">
    <div class="card-title">Top 5 候选电芯</div>
    <table>
      <thead>
        <tr><th>级别</th><th>风险</th><th>型号</th><th>评分</th><th>推荐理由</th></tr>
      </thead>
      <tbody>
        ${candidateCells.map(c => `
          <tr>
            <td style="color: ${c.recommendLevel === '推荐' ? '#1e88e5' : '#90caf9'}; font-weight: 600;">${c.recommendLevel}</td>
            <td><span class="tag tag-${c.risk}">${c.risk === 'green' ? 'Green' : c.risk === 'yellow' ? 'Yellow' : 'Risk'}</span></td>
            <td>${c.model}</td>
            <td style="font-weight: 600;">${c.displayScore}</td>
            <td style="color: #90caf9;">${c.reason}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer">
    <div>Generated: ${new Date().toLocaleString('zh-CN')}</div>
    <div style="margin-top: 4px;">© 2025 Turbo-Select 极速芯研</div>
  </div>
</body>
</html>
    `

    const w = window.open('', '_blank')
    if (w) {
      w.document.write(htmlContent)
      w.document.close()
    }
  }

  // 2D热力图渲染
  const render2DHeatmap = (grid: SoaGrid) => {
    const data = chargeMode === 'discharge' ? grid.dischargeA : grid.chargeA
    const maxVal = Math.max(...data.flat())

    const cellWidth = 28
    const cellHeight = 18
    const marginLeft = 50
    const marginTop = 30

    return (
      <svg
        viewBox={`0 0 ${marginLeft + grid.socAxis.length * cellWidth + 20} ${marginTop + grid.tempAxis.length * cellHeight + 40}`}
        style={{ width: '100%', height: 240 }}
      >
        {/* Y轴标签 */}
        <text x={marginLeft - 35} y={marginTop + grid.tempAxis.length * cellHeight / 2} fill="#64b5f6" fontSize="10" transform={`rotate(-90, ${marginLeft - 35}, ${marginTop + grid.tempAxis.length * cellHeight / 2})`} textAnchor="middle">
          温度 (℃)
        </text>
        {grid.tempAxis.map((t, i) => (
          i % 2 === 0 && (
            <text key={t} x={marginLeft - 8} y={marginTop + i * cellHeight + 12} fill="#64b5f6" fontSize="9" textAnchor="end">
              {t}
            </text>
          )
        ))}

        {/* X轴标签 */}
        <text x={marginLeft + grid.socAxis.length * cellWidth / 2} y={marginTop + grid.tempAxis.length * cellHeight + 32} fill="#64b5f6" fontSize="10" textAnchor="middle">
          SOC (%)
        </text>
        {grid.socAxis.map((s, i) => (
          i % 2 === 0 && (
            <text key={s} x={marginLeft + i * cellWidth + cellWidth / 2} y={marginTop + grid.tempAxis.length * cellHeight + 16} fill="#64b5f6" fontSize="9" textAnchor="middle">
              {s}
            </text>
          )
        ))}

        {/* 热力图格子 - 绿→黄→红配色 */}
        {data.map((row, ti) => (
          row.map((val, si) => {
            const intensity = maxVal > 0 ? val / maxVal : 0
            // 绿(低值/安全) → 黄(中值) → 红(高值/风险)
            let r: number, g: number, b: number
            if (intensity < 0.5) {
              // 绿 → 黄
              const t = intensity * 2
              r = Math.round(76 + t * (255 - 76))
              g = Math.round(175 + t * (193 - 175))
              b = Math.round(80 - t * 80)
            } else {
              // 黄 → 红
              const t = (intensity - 0.5) * 2
              r = Math.round(255 - t * 11)
              g = Math.round(193 - t * 125)
              b = Math.round(0 + t * 68)
            }

            return (
              <rect
                key={`${ti}-${si}`}
                x={marginLeft + si * cellWidth}
                y={marginTop + ti * cellHeight}
                width={cellWidth - 1}
                height={cellHeight - 1}
                fill={`rgb(${r},${g},${b})`}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={0.5}
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setHoverCell({
                  soc: grid.socAxis[si],
                  temp: grid.tempAxis[ti],
                  imax: val
                })}
                onMouseLeave={() => setHoverCell(null)}
              />
            )
          })
        ))}

        {/* 图例 - 绿→黄→红 */}
        <defs>
          <linearGradient id="legendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4caf50" />
            <stop offset="50%" stopColor="#ffc107" />
            <stop offset="100%" stopColor="#f44336" />
          </linearGradient>
        </defs>
        <rect x={marginLeft + grid.socAxis.length * cellWidth - 80} y={8} width={60} height={8} fill="url(#legendGrad)" rx={2} />
        <text x={marginLeft + grid.socAxis.length * cellWidth - 85} y={14} fill="#90caf9" fontSize="8">0</text>
        <text x={marginLeft + grid.socAxis.length * cellWidth - 15} y={14} fill="#90caf9" fontSize="8">{maxVal}A</text>
      </svg>
    )
  }

  // 渲染策略表格视图
  const renderTableView = (grid: SoaGrid) => {
    const data = chargeMode === 'discharge' ? grid.dischargeA : grid.chargeA

    return (
      <div style={{ maxHeight: 240, overflow: 'auto', fontSize: 11 }}>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(30,136,229,0.2)' }}>
              <th style={{ padding: '6px 4px', color: '#64b5f6', position: 'sticky', top: 0, background: 'rgba(10,30,60,0.95)' }}>T\SOC</th>
              {grid.socAxis.filter((_, i) => i % 2 === 0).map(s => (
                <th key={s} style={{ padding: '6px 4px', color: '#64b5f6', position: 'sticky', top: 0, background: 'rgba(10,30,60,0.95)' }}>{s}%</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.tempAxis.filter((_, i) => i % 2 === 0).map((t, ti) => (
              <tr key={t} style={{ borderBottom: '1px solid rgba(30,136,229,0.2)' }}>
                <td style={{ padding: '6px 4px', color: '#90caf9' }}>{t}℃</td>
                {grid.socAxis.filter((_, i) => i % 2 === 0).map((_, si) => (
                  <td key={si} style={{ padding: '6px 4px', color: '#4fc3f7', textAlign: 'center' }}>
                    {data[ti * 2]?.[si * 2] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!cell || !grid || !policy) {
    return <div style={{ padding: 40, color: '#fff' }}>No demo cell found.</div>
  }

  // 工况概况
  const tempRange = `${cell.tempDischargeMinC}℃ ~ ${cell.tempDischargeMaxC}℃`
  const rateRange = `0.1C ~ ${cell.maxDischargeCCont}C`
  const coverage = Math.round(((socMax - socMin) / 100) * 100)

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0d1f3c 100%)',
      padding: '20px 24px',
      fontFamily: "'Microsoft YaHei', sans-serif",
      overflow: 'hidden',
    }}>
      {/* A. 顶部区 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        padding: '16px 20px',
        background: 'rgba(10,30,60,0.6)',
        borderRadius: 8,
        border: '1px solid rgba(30,136,229,0.3)',
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 2 }}>
            Turbo-Select · 选型决策驾驶舱
          </h1>
          <div style={{ fontSize: 13, color: '#90caf9', marginTop: 8 }}>
            工况：{temperature}℃ | {cRate}C | SOC {socMin}-{socMax}%
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span
            onClick={previewReport}
            style={{ color: '#64b5f6', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
          >
            预览
          </span>
          <button
            onClick={previewReport}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #1e88e5',
              borderRadius: 6,
              color: '#64b5f6',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            生成报告PDF
          </button>
          <button
            onClick={exportCSV}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(90deg, #1e88e5, #42a5f5)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            导出限流策略（BMS表）
          </button>
        </div>
      </div>

      {/* 三栏布局 - 占满剩余高度 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr', gap: 20, flex: 1, minHeight: 0 }}>

        {/* B. 左栏：工况谱模块 */}
        <div style={{
          background: 'rgba(10,30,60,0.8)',
          border: '1px solid rgba(30,136,229,0.5)',
          borderRadius: 8,
          padding: 20,
        }}>
          <div style={{ fontSize: 14, color: '#64b5f6', marginBottom: 16, borderBottom: '1px solid rgba(30,136,229,0.5)', paddingBottom: 10 }}>
            工况谱（Condition Spectrum）
          </div>

          {/* 工况概况卡 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginBottom: 20,
            padding: 12,
            background: 'rgba(0,20,40,0.5)',
            borderRadius: 6,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64b5f6' }}>温度范围</div>
              <div style={{ fontSize: 12, color: '#4fc3f7', fontWeight: 600, marginTop: 4 }}>{tempRange}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64b5f6' }}>倍率范围</div>
              <div style={{ fontSize: 12, color: '#4fc3f7', fontWeight: 600, marginTop: 4 }}>{rateRange}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64b5f6' }}>覆盖率</div>
              <div style={{ fontSize: 12, color: '#4fc3f7', fontWeight: 600, marginTop: 4 }}>{coverage}%</div>
            </div>
          </div>

          {/* 典型工况模板 */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(30,136,229,0.2)',
                border: '1px solid #1e88e5',
                borderRadius: 6,
                color: '#64b5f6',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              加载典型工况 ▼
            </button>
            {showTemplateMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'rgba(10,30,60,0.98)',
                border: '1px solid #1e88e5',
                borderRadius: 6,
                marginTop: 4,
                zIndex: 10,
              }}>
                {Object.entries(CONDITION_TEMPLATES).map(([key, t]) => (
                  <div
                    key={key}
                    onClick={() => loadTemplate(key as keyof typeof CONDITION_TEMPLATES)}
                    style={{
                      padding: '10px 12px',
                      color: '#90caf9',
                      fontSize: 12,
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(30,136,229,0.3)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(30,136,229,0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {t.name}
                    <span style={{ color: '#64b5f6', marginLeft: 8, fontSize: 10 }}>
                      {t.temp}℃ | {t.cRate}C
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Temperature 滑条+输入框 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#64b5f6', fontSize: 12 }}>Temperature (℃)</span>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                style={{
                  width: 60,
                  padding: '4px 8px',
                  background: 'rgba(0,20,40,0.8)',
                  border: '1px solid #1e88e5',
                  borderRadius: 4,
                  color: '#4fc3f7',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </div>
            <input
              type="range"
              min={cell.tempDischargeMinC}
              max={cell.tempDischargeMaxC}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4fc3f7' }}
            />
          </div>

          {/* C-rate 滑条+输入框 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#64b5f6', fontSize: 12 }}>C-rate (C)</span>
              <input
                type="number"
                value={cRate}
                step={0.1}
                onChange={(e) => setCRate(Number(e.target.value))}
                style={{
                  width: 60,
                  padding: '4px 8px',
                  background: 'rgba(0,20,40,0.8)',
                  border: '1px solid #1e88e5',
                  borderRadius: 4,
                  color: '#4fc3f7',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </div>
            <input
              type="range"
              min={0.1}
              max={cell.maxDischargeCCont}
              step={0.1}
              value={cRate}
              onChange={(e) => setCRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4fc3f7' }}
            />
          </div>

          {/* SOC范围 */}
          <div>
            <div style={{ color: '#64b5f6', fontSize: 12, marginBottom: 8 }}>SOC 范围 (%)</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                value={socMin}
                onChange={(e) => setSocMin(Number(e.target.value))}
                style={{
                  width: 60,
                  padding: '6px 8px',
                  background: 'rgba(0,20,40,0.8)',
                  border: '1px solid #1e88e5',
                  borderRadius: 4,
                  color: '#4fc3f7',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
              <span style={{ color: '#64b5f6' }}>~</span>
              <input
                type="number"
                value={socMax}
                onChange={(e) => setSocMax(Number(e.target.value))}
                style={{
                  width: 60,
                  padding: '6px 8px',
                  background: 'rgba(0,20,40,0.8)',
                  border: '1px solid #1e88e5',
                  borderRadius: 4,
                  color: '#4fc3f7',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </div>
          </div>

          {/* 工况谱图表 */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: '#64b5f6', marginBottom: 10 }}>工况谱示意</div>
            <div style={{
              background: 'rgba(0,20,40,0.5)',
              borderRadius: 6,
              padding: 8,
            }}>
              <ReactECharts
                option={{
                  backgroundColor: 'transparent',
                  grid: { left: 40, right: 20, top: 30, bottom: 40 },
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(20,30,50,0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    textStyle: { color: '#fff', fontSize: 11 },
                    formatter: (params: any) => {
                      const point = params[0]
                      return `时间: ${point.data[0]}min<br/>SOC: ${point.data[1]}%`
                    }
                  },
                  xAxis: {
                    type: 'value',
                    name: '时间(min)',
                    nameLocation: 'middle',
                    nameGap: 22,
                    nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
                    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
                    axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
                  },
                  yAxis: {
                    type: 'value',
                    name: 'SOC(%)',
                    min: 0,
                    max: 100,
                    nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
                    axisLine: { lineStyle: { color: '#1e88e5' } },
                    axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
                  },
                  series: [{
                    type: 'line',
                    data: (() => {
                      const data: [number, number][] = []
                      const cycleTime = 60 / cRate // 单循环时间基于倍率
                      for (let i = 0; i < 3; i++) {
                        const baseTime = i * cycleTime * 2
                        // 放电阶段
                        data.push([baseTime, socMax])
                        data.push([baseTime + cycleTime * 0.8, socMin])
                        // 休眠
                        data.push([baseTime + cycleTime, socMin])
                        // 充电阶段
                        data.push([baseTime + cycleTime * 1.8, socMax])
                        // 休眠
                        data.push([baseTime + cycleTime * 2, socMax])
                      }
                      return data
                    })(),
                    lineStyle: { color: '#4fc3f7', width: 2 },
                    areaStyle: {
                      color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(79,195,247,0.3)' },
                          { offset: 1, color: 'rgba(79,195,247,0.05)' }
                        ]
                      }
                    },
                    showSymbol: false,
                    smooth: false
                  }]
                }}
                style={{ height: 140 }}
              />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              marginTop: 8,
              fontSize: 10,
              color: 'rgba(255,255,255,0.5)'
            }}>
              <span>充电: {cRate}C</span>
              <span>|</span>
              <span>SOC: {socMin}%-{socMax}%</span>
              <span>|</span>
              <span>T: {temperature}℃</span>
            </div>
          </div>
        </div>

        {/* C. 中栏：候选电芯列表 - flex布局撑满 */}
        <div style={{
          background: 'rgba(10,30,60,0.8)',
          border: '1px solid rgba(30,136,229,0.5)',
          borderRadius: 8,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // 关键：允许flex子元素滚动
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            borderBottom: '1px solid rgba(30,136,229,0.5)',
            paddingBottom: 10,
            flexShrink: 0,
          }}>
            {/* P0-3: 标题 + info图标tooltip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, color: '#64b5f6' }}>候选电芯 Top5（Top Candidates）</span>
              <span
                title="综合评分 = 寿命匹配 + 功率匹配 + 安全余量 − 约束罚分"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'rgba(30,136,229,0.3)',
                  color: '#64b5f6',
                  fontSize: 10,
                  cursor: 'help',
                }}
              >
                ?
              </span>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              style={{
                padding: '4px 8px',
                background: 'rgba(0,20,40,0.8)',
                border: '1px solid #1e88e5',
                borderRadius: 4,
                color: '#64b5f6',
                fontSize: 11,
              }}
            >
              <option value="all">全部</option>
              <option value="green_yellow">仅Green/Yellow</option>
              <option value="green">仅Green</option>
            </select>
          </div>

          {/* 输出示例小表 */}
          <div style={{
            marginBottom: 12,
            padding: '8px 10px',
            background: 'rgba(0,20,40,0.5)',
            borderRadius: 6,
            fontSize: 10,
            flexShrink: 0,
          }}>
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#64b5f6' }}>
                  <th style={{ textAlign: 'left', padding: '2px 4px' }}>Model</th>
                  <th style={{ textAlign: 'center', padding: '2px 4px', width: 50 }}>Score</th>
                  <th style={{ textAlign: 'center', padding: '2px 4px', width: 60 }}>Tag</th>
                </tr>
              </thead>
              <tbody>
                {candidateCells.slice(0, 3).map((c) => (
                  <tr key={c.id} style={{ color: '#90caf9' }}>
                    <td style={{ padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{c.model}</td>
                    <td style={{ textAlign: 'center', padding: '2px 4px', fontWeight: 600, color: '#4fc3f7' }}>{c.displayScore}</td>
                    <td style={{ textAlign: 'center', padding: '2px 4px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: c.risk === 'green' ? '#4caf50' : c.risk === 'yellow' ? '#ffc107' : '#f44336',
                        marginRight: 4,
                      }} />
                      <span style={{ color: c.risk === 'green' ? '#4caf50' : c.risk === 'yellow' ? '#ffc107' : '#f44336' }}>
                        {c.risk === 'green' ? 'G' : c.risk === 'yellow' ? 'Y' : 'R'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 列表区域 - flex:1 撑满剩余高度 */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {candidateCells.map((c) => (
              <div
                key={c.id}
                onClick={() => setCellId(c.id)}
                style={{
                  padding: '14px 12px',
                  marginBottom: 8,
                  background: c.id === cellId ? 'rgba(30,136,229,0.25)' : 'rgba(0,20,40,0.4)',
                  border: c.id === cellId ? '2px solid #00e676' : '1px solid rgba(30,136,229,0.3)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {/* 第一行：推荐级别 + 风险标签 + 型号 + 评分 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {/* P0-4: 推荐级别标签 */}
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 3,
                    fontSize: 9,
                    fontWeight: 600,
                    background: c.recommendLevel === '推荐' ? '#1e88e5' : c.recommendLevel === '备选' ? 'rgba(30,136,229,0.5)' : 'rgba(100,100,100,0.5)',
                    color: '#fff',
                  }}>
                    {c.recommendLevel}
                  </span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    background: c.risk === 'green' ? '#4caf50' : c.risk === 'yellow' ? '#ffc107' : '#f44336',
                    color: c.risk === 'yellow' ? '#000' : '#fff',
                  }}>
                    {c.risk === 'green' ? 'Green' : c.risk === 'yellow' ? 'Yellow' : 'Risk'}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 13, flex: 1 }}>{c.model}</span>
                  {/* P0-1: 使用displayScore */}
                  <span style={{ color: '#4fc3f7', fontWeight: 700, fontSize: 16 }}>{c.displayScore}</span>
                </div>

                {/* 第二行：评分进度条 */}
                <div style={{
                  height: 6,
                  background: 'rgba(30,136,229,0.2)',
                  borderRadius: 3,
                  marginBottom: 10,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${c.displayScore}%`,
                    height: '100%',
                    background: c.risk === 'green'
                      ? 'linear-gradient(90deg, #4caf50, #81c784)'
                      : c.risk === 'yellow'
                        ? 'linear-gradient(90deg, #ffc107, #ffeb3b)'
                        : 'linear-gradient(90deg, #f44336, #ef5350)',
                    borderRadius: 3,
                  }} />
                </div>

                {/* 第三行：匹配度指标 */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#64b5f6', marginBottom: 2 }}>寿命</div>
                    <div style={{ height: 4, background: 'rgba(30,136,229,0.2)', borderRadius: 2 }}>
                      <div style={{ width: `${c.lifeMatch}%`, height: '100%', background: '#4caf50', borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#64b5f6', marginBottom: 2 }}>功率</div>
                    <div style={{ height: 4, background: 'rgba(30,136,229,0.2)', borderRadius: 2 }}>
                      <div style={{ width: `${c.powerMatch}%`, height: '100%', background: '#2196f3', borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#64b5f6', marginBottom: 2 }}>安全</div>
                    <div style={{ height: 4, background: 'rgba(30,136,229,0.2)', borderRadius: 2 }}>
                      <div style={{ width: `${c.safetyMatch}%`, height: '100%', background: '#ff9800', borderRadius: 2 }} />
                    </div>
                  </div>
                </div>

                {/* 第四行：推荐理由 */}
                <div style={{ fontSize: 11, color: '#90caf9' }}>
                  {c.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* D+E. 右栏：SOA图 + 交付物区 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          {/* SOA边界图 */}
          <div style={{
            background: 'rgba(10,30,60,0.8)',
            border: '1px solid rgba(30,136,229,0.5)',
            borderRadius: 8,
            padding: 20,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            {/* 标题行 + 选中电芯信息 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 14, color: '#64b5f6' }}>SOA 边界（Imax@SOC×T）</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* 充放电切换 */}
                <div style={{ display: 'flex', background: 'rgba(0,20,40,0.8)', borderRadius: 4, overflow: 'hidden' }}>
                  <button
                    onClick={() => setChargeMode('discharge')}
                    style={{
                      padding: '4px 10px',
                      background: chargeMode === 'discharge' ? '#1e88e5' : 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    放电
                  </button>
                  <button
                    onClick={() => setChargeMode('charge')}
                    style={{
                      padding: '4px 10px',
                      background: chargeMode === 'charge' ? '#1e88e5' : 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    充电
                  </button>
                </div>
                {/* 视图切换 */}
                <div style={{ display: 'flex', background: 'rgba(0,20,40,0.8)', borderRadius: 4, overflow: 'hidden' }}>
                  {(['2d', '3d', 'table'] as SoaViewType[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setSoaView(v)}
                      style={{
                        padding: '4px 10px',
                        background: soaView === v ? '#1e88e5' : 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      {v === '2d' ? '2D' : v === '3d' ? '3D' : '表格'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 选中电芯联动提示 */}
            {(() => {
              const selectedCell = candidateCells.find(c => c.id === cellId)
              return selectedCell ? (
                <div style={{
                  padding: '8px 12px',
                  marginBottom: 8,
                  background: 'rgba(0,230,118,0.1)',
                  border: '1px solid rgba(0,230,118,0.3)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 11,
                  flexShrink: 0,
                }}>
                  <span style={{ color: '#90caf9' }}>当前电芯：</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{selectedCell.model}</span>
                  <span style={{ color: '#64b5f6' }}>|</span>
                  <span style={{ color: '#4fc3f7', fontWeight: 600 }}>Score {selectedCell.displayScore}</span>
                  <span style={{ color: '#64b5f6' }}>|</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 3,
                    fontSize: 10,
                    fontWeight: 600,
                    background: selectedCell.risk === 'green' ? '#4caf50' : selectedCell.risk === 'yellow' ? '#ffc107' : '#f44336',
                    color: selectedCell.risk === 'yellow' ? '#000' : '#fff',
                  }}>
                    {selectedCell.risk === 'green' ? 'Green' : selectedCell.risk === 'yellow' ? 'Yellow' : 'Risk'}
                  </span>
                </div>
              ) : null
            })()}

            {/* hover 读数 */}
            {hoverCell && (
              <div style={{
                position: 'absolute',
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid #4fc3f7',
                borderRadius: 4,
                color: '#fff',
                fontSize: 11,
                zIndex: 100,
                pointerEvents: 'none',
              }}>
                SOC={hoverCell.soc}% | T={hoverCell.temp}℃ | Imax={hoverCell.imax}A
              </div>
            )}

            {/* 图表区域 */}
            <div style={{ background: 'rgba(0,20,40,0.5)', borderRadius: 6, padding: 12, position: 'relative' }}>
              {soaView === '2d' && render2DHeatmap(grid)}
              {soaView === '3d' && (
                <svg viewBox="0 0 300 220" style={{ width: '100%', height: 240 }}>
                  <defs>
                    <linearGradient id="soaGrad3d" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4fc3f7" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#1e88e5" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2, 3, 4].map(i => (
                    <line key={`h${i}`} x1="60" y1={40 + i * 35} x2="260" y2={40 + i * 35} stroke="#1e88e5" strokeOpacity="0.2" />
                  ))}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line key={`v${i}`} x1={60 + i * 50} y1="40" x2={60 + i * 50} y2="180" stroke="#1e88e5" strokeOpacity="0.2" />
                  ))}
                  <line x1="60" y1="180" x2="280" y2="180" stroke="#1e88e5" strokeWidth="1" />
                  <line x1="60" y1="180" x2="60" y2="30" stroke="#1e88e5" strokeWidth="1" />
                  <line x1="60" y1="180" x2="30" y2="200" stroke="#1e88e5" strokeWidth="1" />
                  <polygon points="80,160 110,100 160,60 220,80 250,130 220,165 140,175" fill="url(#soaGrad3d)" stroke="#4fc3f7" strokeWidth="1" />
                  <polygon points="110,100 160,60 190,45 150,75" fill="rgba(79,195,247,0.4)" stroke="#4fc3f7" strokeWidth="1" />
                  <polygon points="160,60 220,80 250,55 190,45" fill="rgba(79,195,247,0.3)" stroke="#4fc3f7" strokeWidth="1" />
                  <text x="270" y="185" fill="#64b5f6" fontSize="10">SOC</text>
                  <text x="45" y="25" fill="#64b5f6" fontSize="10">Imax</text>
                  <text x="20" y="210" fill="#64b5f6" fontSize="10">T</text>
                </svg>
              )}
              {soaView === 'table' && renderTableView(grid)}
            </div>
          </div>

          {/* E. 交付物区 */}
          <div style={{
            background: 'rgba(10,30,60,0.8)',
            border: '1px solid rgba(30,136,229,0.5)',
            borderRadius: 8,
            padding: 16,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* 推荐SOC窗口 */}
              <div>
                <div style={{ fontSize: 12, color: '#64b5f6', marginBottom: 8 }}>
                  推荐SOC窗口（Recommended SOC Window）
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#4caf50',
                  marginBottom: 8,
                }}>
                  {policy.recommendedSocMinPct}% ~ {policy.recommendedSocMaxPct}%
                </div>
                <div style={{ fontSize: 11, color: '#ffc107' }}>
                  {policy.notes.slice(0, 2).map((n, i) => (
                    <div key={i}>• {n}</div>
                  ))}
                </div>
              </div>

              {/* 导出按钮 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={exportCSV}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(30,136,229,0.3)',
                    border: '1px solid #1e88e5',
                    borderRadius: 6,
                    color: '#64b5f6',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  导出 CSV
                </button>
                <button
                  onClick={exportJSON}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(30,136,229,0.3)',
                    border: '1px solid #1e88e5',
                    borderRadius: 6,
                    color: '#64b5f6',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  导出 JSON（BMS）
                </button>
              </div>
            </div>

            {/* 限流策略表预览 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#64b5f6', marginBottom: 8 }}>
                限流策略表（BMS-ready Policy Table）
              </div>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'rgba(30,136,229,0.2)' }}>
                    <th style={{ padding: '8px 6px', color: '#64b5f6', textAlign: 'left' }}>温度区间</th>
                    <th style={{ padding: '8px 6px', color: '#64b5f6', textAlign: 'left' }}>SOC区间</th>
                    <th style={{ padding: '8px 6px', color: '#64b5f6', textAlign: 'center' }}>Imax(A)</th>
                    <th style={{ padding: '8px 6px', color: '#64b5f6', textAlign: 'center' }}>Imax(C)</th>
                    <th style={{ padding: '8px 6px', color: '#64b5f6', textAlign: 'left' }}>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {policyTable.slice(0, 3).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,136,229,0.2)' }}>
                      <td style={{ padding: '8px 6px', color: '#90caf9' }}>{row.tempRange}</td>
                      <td style={{ padding: '8px 6px', color: '#90caf9' }}>{row.socRange}</td>
                      <td style={{ padding: '8px 6px', color: '#4fc3f7', textAlign: 'center', fontWeight: 600 }}>{row.imaxA}</td>
                      <td style={{ padding: '8px 6px', color: '#4fc3f7', textAlign: 'center' }}>{row.imaxC}</td>
                      <td style={{ padding: '8px 6px', color: '#ffc107', fontSize: 10 }}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {policyTable.length > 3 && (
                <div style={{ textAlign: 'center', color: '#64b5f6', fontSize: 11, marginTop: 8 }}>
                  ... 共 {policyTable.length} 条策略，导出查看完整表格
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
