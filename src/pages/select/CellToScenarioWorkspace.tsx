import { useMemo, useState } from 'react'
import { Select, InputNumber, Slider, Button, Tooltip, Tag } from 'antd'
import {
  ExperimentOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AimOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { DEMO_CELLS, getDemoCellById } from '../../demo/cells'
import { chemistryLabel } from '../../utils/battery'
import { buildSoaGrid, getDefaultSoaPolicy } from '../../utils/soa'
import { Link } from 'react-router-dom'

// ==================== Types ====================
type CoverageLevel = 'high' | 'medium' | 'low'
type ChargeMode = 'discharge' | 'charge'
type SoaViewType = '2d' | '3d' | 'table'

interface PolicyRow {
  tempRange: string
  socRange: string
  imaxA: number
  imaxC: number
  note: string
}

// ==================== Coverage Calculation ====================
function calculateCoverage(cell: any, temperature: number, cRate: number): { level: CoverageLevel; percentage: number; missingItems: string[] } {
  const missingItems: string[] = []
  let coverage = 100

  // Check for edge cases that reduce coverage
  if (temperature < cell.tempDischargeMinC) {
    coverage -= 30
    missingItems.push(`温度${temperature}°C低于电芯最低工作温度${cell.tempDischargeMinC}°C`)
  }
  if (temperature > cell.tempDischargeMaxC) {
    coverage -= 30
    missingItems.push(`温度${temperature}°C高于电芯最高工作温度${cell.tempDischargeMaxC}°C`)
  }
  if (cRate > cell.maxDischargeCCont) {
    coverage -= 25
    missingItems.push(`倍率${cRate}C超过电芯最大持续倍率${cell.maxDischargeCCont}C`)
  }
  if (cRate > cell.maxDischargeCCont * 0.8) {
    coverage -= 10
    missingItems.push('倍率接近边界，建议补充高倍率测试数据')
  }

  let level: CoverageLevel = 'high'
  if (coverage < 60) level = 'low'
  else if (coverage < 80) level = 'medium'

  return { level, percentage: Math.max(0, coverage), missingItems }
}

// ==================== Component ====================
export default function CellToScenarioWorkspace() {
  const [cellId, setCellId] = useState(DEMO_CELLS[0]?.id ?? '')
  const [temperature, setTemperature] = useState(25)
  const [cRate, setCRate] = useState(1)
  const [socMin, setSocMin] = useState(15)
  const [socMax, setSocMax] = useState(85)
  const [chargeMode, setChargeMode] = useState<ChargeMode>('discharge')
  const [soaView, setSoaView] = useState<SoaViewType>('2d')


  const cell = getDemoCellById(cellId)
  const grid = useMemo(() => (cell ? buildSoaGrid(cell) : null), [cell])
  const policy = useMemo(() => (cell ? getDefaultSoaPolicy(cell) : null), [cell])

  // Calculate coverage
  const coverage = useMemo(() => {
    if (!cell) return { level: 'high' as CoverageLevel, percentage: 100, missingItems: [] }
    return calculateCoverage(cell, temperature, cRate)
  }, [cell, temperature, cRate])

  // Generate policy table
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

    return rows.slice(0, 12)
  }, [cell, grid, chargeMode])

  // Export functions
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

  const exportJSON = () => {
    if (!cell || !policyTable.length) return

    const data = {
      cellModel: cell.model,
      chemistry: cell.chemistry,
      generatedAt: new Date().toISOString(),
      condition: { temperature, cRate, socMin, socMax },
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

  // Generate SOA heatmap ECharts option
  const heatmapOption = useMemo(() => {
    if (!grid) return null

    const data: [number, number, number][] = []
    const currentData = chargeMode === 'discharge' ? grid.dischargeA : grid.chargeA
    const maxVal = Math.max(...currentData.flat())

    currentData.forEach((row, ti) => {
      row.forEach((val, si) => {
        data.push([si, ti, val])
      })
    })

    return {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (params: any) => {
          const soc = grid.socAxis[params.data[0]]
          const temp = grid.tempAxis[params.data[1]]
          const imax = params.data[2]
          return `SOC: ${soc}%<br/>温度: ${temp}°C<br/>Imax: ${imax}A`
        }
      },
      grid: { left: 60, right: 80, top: 40, bottom: 60 },
      xAxis: {
        type: 'category',
        data: grid.socAxis.map(s => `${s}%`),
        name: 'SOC',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, interval: 1 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
      },
      yAxis: {
        type: 'category',
        data: grid.tempAxis.map(t => `${t}°C`),
        name: '温度',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
      },
      visualMap: {
        min: 0,
        max: maxVal,
        calculable: true,
        orient: 'vertical',
        right: 10,
        top: 'center',
        inRange: {
          color: ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#f44336']
        },
        textStyle: { color: 'rgba(255,255,255,0.65)' },
        text: [`${maxVal}A`, '0'],
      },
      series: [{
        type: 'heatmap',
        data: data,
        itemStyle: { borderRadius: 2 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    }
  }, [grid, chargeMode])

  // Workload spectrum chart option
  const workloadOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 45, right: 20, top: 25, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20,30,50,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontSize: 11 },
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
      axisLine: { lineStyle: { color: 'rgba(61,220,151,0.5)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      type: 'line',
      data: (() => {
        const data: [number, number][] = []
        const cycleTime = 60 / cRate
        for (let i = 0; i < 3; i++) {
          const baseTime = i * cycleTime * 2
          data.push([baseTime, socMax])
          data.push([baseTime + cycleTime * 0.8, socMin])
          data.push([baseTime + cycleTime, socMin])
          data.push([baseTime + cycleTime * 1.8, socMax])
          data.push([baseTime + cycleTime * 2, socMax])
        }
        return data
      })(),
      lineStyle: { color: '#3ddc97', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(61,220,151,0.3)' },
            { offset: 1, color: 'rgba(61,220,151,0.05)' }
          ]
        }
      },
      showSymbol: false,
      smooth: false
    }]
  }), [cRate, socMin, socMax])

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

  if (!cell || !grid || !policy) {
    return <div style={{ padding: 40, color: '#fff' }}>请选择一个电芯型号</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(61,220,151,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ExperimentOutlined style={{ fontSize: 20, color: '#3ddc97' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'rgba(255,255,255,0.92)' }}>
              Cell → Scenario 运行边界评估
            </h2>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              选择电芯型号，评估安全边界与BMS策略
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Status Bar */}
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
            <Link to={`/custom-eval/create?from=select&mode=cell-to-scenario&cellId=${cellId}`}>
              <Button type="primary" size="small" style={{ background: '#ff6b6b', borderColor: '#ff6b6b' }}>
                申请定制评估报告
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, minHeight: 'calc(100vh - 280px)' }}>
        {/* Left Column: Cell Input */}
        <div style={panelStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AimOutlined style={{ color: '#3ddc97' }} />
            电芯输入
          </div>

          {/* Cell Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>选择电芯型号</label>
            <Select
              value={cellId}
              onChange={(value) => setCellId(value)}
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1a2438' }}
              options={DEMO_CELLS.map(c => ({
                value: c.id,
                label: `${c.model} (${chemistryLabel(c.chemistry)})`
              }))}
            />
          </div>

          {/* Cell Info Card */}
          <div style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            background: 'rgba(61,220,151,0.1)',
            border: '1px solid rgba(61,220,151,0.3)'
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{cell.model}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
              <div>化学体系: {chemistryLabel(cell.chemistry)}</div>
              <div>容量: {cell.capacityAh}Ah</div>
              <div>持续倍率: {cell.maxDischargeCCont}C</div>
              <div>温度范围: {cell.tempDischargeMinC}°C ~ {cell.tempDischargeMaxC}°C</div>
              <div>循环寿命: {cell.cycleLife80DoD25C}次 (80% DOD @25°C)</div>
            </div>
          </div>

          {/* Operating Parameters */}
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
            运行工况参数
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              运行温度: {temperature}°C
            </label>
            <Slider
              min={cell.tempDischargeMinC}
              max={cell.tempDischargeMaxC}
              value={temperature}
              onChange={(v) => setTemperature(v)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              运行倍率: {cRate}C
            </label>
            <Slider
              min={0.1}
              max={cell.maxDischargeCCont}
              step={0.1}
              value={cRate}
              onChange={(v) => setCRate(v)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>SOC 运行范围 (%)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <InputNumber value={socMin} onChange={(v) => setSocMin(v || 10)} style={{ ...inputStyle, width: '100%' }} min={0} max={100} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>~</span>
              <InputNumber value={socMax} onChange={(v) => setSocMax(v || 90)} style={{ ...inputStyle, width: '100%' }} min={0} max={100} />
            </div>
          </div>

          {/* Workload Spectrum Chart */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>工况谱示意</div>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: 8 }}>
              <ReactECharts option={workloadOption} style={{ height: 120 }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginTop: 6,
              fontSize: 10,
              color: 'rgba(255,255,255,0.5)'
            }}>
              <span>{cRate}C</span>
              <span>|</span>
              <span>SOC {socMin}%-{socMax}%</span>
              <span>|</span>
              <span>{temperature}°C</span>
            </div>
          </div>
        </div>

        {/* Right Column: Boundary Assessment Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SOA Heatmap */}
          <div style={{ ...panelStyle, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>SOA 安全边界热力图</span>
                <Tooltip title="绿色=安全区域，黄色=注意区域，红色=禁止区域">
                  <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.5)', cursor: 'help' }} />
                </Tooltip>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Charge/Discharge Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                  <button
                    onClick={() => setChargeMode('discharge')}
                    style={{
                      padding: '6px 12px',
                      background: chargeMode === 'discharge' ? 'rgba(61,220,151,0.2)' : 'transparent',
                      border: 'none',
                      color: chargeMode === 'discharge' ? '#3ddc97' : 'rgba(255,255,255,0.65)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    放电
                  </button>
                  <button
                    onClick={() => setChargeMode('charge')}
                    style={{
                      padding: '6px 12px',
                      background: chargeMode === 'charge' ? 'rgba(61,220,151,0.2)' : 'transparent',
                      border: 'none',
                      color: chargeMode === 'charge' ? '#3ddc97' : 'rgba(255,255,255,0.65)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    充电
                  </button>
                </div>
                {/* View Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                  {(['2d', 'table'] as SoaViewType[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setSoaView(v)}
                      style={{
                        padding: '6px 12px',
                        background: soaView === v ? 'rgba(110,168,254,0.2)' : 'transparent',
                        border: 'none',
                        color: soaView === v ? '#6ea8fe' : 'rgba(255,255,255,0.65)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {v === '2d' ? '热力图' : '表格'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap or Table */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12 }}>
              {soaView === '2d' && heatmapOption && (
                <ReactECharts option={heatmapOption} style={{ height: 300 }} />
              )}
              {soaView === 'table' && (
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'rgba(61,220,151,0.1)' }}>
                        <th style={{ padding: '10px 8px', color: '#3ddc97', textAlign: 'left', position: 'sticky', top: 0, background: 'rgba(15,25,40,0.95)' }}>温度区间</th>
                        <th style={{ padding: '10px 8px', color: '#3ddc97', textAlign: 'left', position: 'sticky', top: 0, background: 'rgba(15,25,40,0.95)' }}>SOC区间</th>
                        <th style={{ padding: '10px 8px', color: '#3ddc97', textAlign: 'center', position: 'sticky', top: 0, background: 'rgba(15,25,40,0.95)' }}>Imax(A)</th>
                        <th style={{ padding: '10px 8px', color: '#3ddc97', textAlign: 'center', position: 'sticky', top: 0, background: 'rgba(15,25,40,0.95)' }}>Imax(C)</th>
                        <th style={{ padding: '10px 8px', color: '#3ddc97', textAlign: 'left', position: 'sticky', top: 0, background: 'rgba(15,25,40,0.95)' }}>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policyTable.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.85)' }}>{row.tempRange}</td>
                          <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.85)' }}>{row.socRange}</td>
                          <td style={{ padding: '10px 8px', color: '#3ddc97', textAlign: 'center', fontWeight: 600 }}>{row.imaxA}</td>
                          <td style={{ padding: '10px 8px', color: '#3ddc97', textAlign: 'center' }}>{row.imaxC}</td>
                          <td style={{ padding: '10px 8px', color: '#ffcc66', fontSize: 11 }}>{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recommended SOC Window + BMS Policy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Recommended SOC Window */}
            <div style={panelStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>推荐 SOC 窗口</div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#3ddc97',
                marginBottom: 12,
              }}>
                {policy.recommendedSocMinPct}% ~ {policy.recommendedSocMaxPct}%
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                {policy.notes.slice(0, 3).map((n, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>• {n}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(61,220,151,0.1)', borderRadius: 6, fontSize: 11, color: '#3ddc97' }}>
                基于 温度-SOC-倍率 三维约束计算
              </div>
            </div>

            {/* BMS Policy Summary */}
            <div style={panelStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>BMS 限流策略摘要</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
                当前模式: <Tag color={chargeMode === 'discharge' ? 'green' : 'blue'}>{chargeMode === 'discharge' ? '放电' : '充电'}</Tag>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {policyTable.slice(0, 4).map((row, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 4,
                    fontSize: 11
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{row.tempRange} / {row.socRange}</span>
                    <span style={{ color: '#3ddc97', fontWeight: 600 }}>{row.imaxC}C</span>
                  </div>
                ))}
                {policyTable.length > 4 && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                    ... 共 {policyTable.length} 条策略
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Tooltip title={isLowCoverage ? '数据覆盖度不足，无法导出' : ''}>
              <Button
                block
                icon={<DownloadOutlined />}
                disabled={isLowCoverage}
                onClick={exportCSV}
                style={{
                  height: 44,
                  background: isLowCoverage ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: isLowCoverage ? 'rgba(255,255,255,0.3)' : '#fff'
                }}
              >
                导出 BMS 策略表 (CSV)
              </Button>
            </Tooltip>
            <Tooltip title={isLowCoverage ? '数据覆盖度不足，无法导出' : ''}>
              <Button
                block
                icon={<DownloadOutlined />}
                disabled={isLowCoverage}
                onClick={exportJSON}
                style={{
                  height: 44,
                  background: isLowCoverage ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: isLowCoverage ? 'rgba(255,255,255,0.3)' : '#fff'
                }}
              >
                导出 BMS 策略表 (JSON)
              </Button>
            </Tooltip>
            <Tooltip title={isLowCoverage ? '数据覆盖度不足，无法导出' : ''}>
              <Button
                block
                type="primary"
                icon={<FileTextOutlined />}
                disabled={isLowCoverage}
                style={{
                  height: 44,
                  background: isLowCoverage ? 'rgba(61,220,151,0.2)' : '#3ddc97',
                  borderColor: isLowCoverage ? 'rgba(61,220,151,0.3)' : '#3ddc97',
                  color: isLowCoverage ? 'rgba(255,255,255,0.3)' : '#0b1220'
                }}
              >
                生成 PDF 报告
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
