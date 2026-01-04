import { ThreeColumnLayout } from '../../components/common/ThreeColumnLayout'
import { Select, InputNumber, Slider, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { useSelect } from '../../contexts/SelectContext'

export default function S1ScenarioBuilder() {
  const navigate = useNavigate()
  const { scenario, setScenario } = useSelect()

  const leftPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>工况输入</h3>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
          工况类型
        </label>
        <Select
          value={scenario.type}
          onChange={(value) => setScenario({ ...scenario, type: value })}
          style={{ width: '100%' }}
          options={[
            { value: 'fast_charging', label: '车用快充' },
            { value: 'energy_storage', label: '储能日循环' },
            { value: 'high_temp_storage', label: '高温存储' }
          ]}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
          温度范围 (°C)
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <InputNumber
            value={scenario.tempMin}
            onChange={(value) => setScenario({ ...scenario, tempMin: value || -10 })}
            style={{ width: 100 }}
          />
          <span>~</span>
          <InputNumber
            value={scenario.tempMax}
            onChange={(value) => setScenario({ ...scenario, tempMax: value || 45 })}
            style={{ width: 100 }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
          充电倍率 (C)
        </label>
        <Slider
          min={0.5}
          max={5}
          step={0.5}
          value={scenario.chargeRate}
          onChange={(value) => setScenario({ ...scenario, chargeRate: value })}
          marks={{ 0.5: '0.5C', 2: '2C', 5: '5C' }}
        />
        <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
          {scenario.chargeRate}C
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
          放电倍率 (C)
        </label>
        <Slider
          min={0.5}
          max={3}
          step={0.5}
          value={scenario.dischargeRate}
          onChange={(value) => setScenario({ ...scenario, dischargeRate: value })}
          marks={{ 0.5: '0.5C', 1.5: '1.5C', 3: '3C' }}
        />
        <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
          {scenario.dischargeRate}C
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
          SOC 窗口 (%)
        </label>
        <Slider
          range
          min={0}
          max={100}
          value={[scenario.socMin, scenario.socMax]}
          onChange={(value) => setScenario({ ...scenario, socMin: value[0], socMax: value[1] })}
          marks={{ 0: '0%', 50: '50%', 100: '100%' }}
        />
        <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
          {scenario.socMin}% ~ {scenario.socMax}%
        </div>
      </div>
    </div>
  )

  // 生成工况谱数据
  const generateScenarioData = () => {
    const data = []
    const cycles = 10 // 显示10个循环
    for (let i = 0; i < cycles; i++) {
      const baseTime = i * 120
      // 充电阶段
      data.push([baseTime, scenario.socMin, scenario.tempMin + 5])
      data.push([baseTime + 30, scenario.socMax, scenario.tempMax - 5])
      // 休眠阶段
      data.push([baseTime + 40, scenario.socMax, scenario.tempMax - 10])
      // 放电阶段
      data.push([baseTime + 50, scenario.socMax, scenario.tempMax - 5])
      data.push([baseTime + 80, scenario.socMin, scenario.tempMin + 5])
      // 休眠阶段
      data.push([baseTime + 90, scenario.socMin, scenario.tempMin + 3])
    }
    return data
  }

  const scenarioChartOption = {
    title: {
      text: '工况谱示意图',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }
    },
    grid: { left: 60, right: 40, top: 60, bottom: 60 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20,30,50,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const point = params[0]
        return `时间: ${point.data[0]}min<br/>SOC: ${point.data[1]}%<br/>温度: ${point.data[2]}°C`
      }
    },
    xAxis: {
      type: 'value',
      name: '时间 (min)',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    yAxis: [
      {
        type: 'value',
        name: 'SOC (%)',
        position: 'left',
        min: 0,
        max: 100,
        nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
        axisLine: { lineStyle: { color: '#1890ff' } },
        axisLabel: { color: 'rgba(255,255,255,0.65)' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
      },
      {
        type: 'value',
        name: '温度 (°C)',
        position: 'right',
        nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
        axisLine: { lineStyle: { color: '#ff4d4f' } },
        axisLabel: { color: 'rgba(255,255,255,0.65)' }
      }
    ],
    series: [
      {
        name: 'SOC',
        type: 'line',
        data: generateScenarioData().map(d => [d[0], d[1]]),
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
        showSymbol: false,
        yAxisIndex: 0
      },
      {
        name: '温度',
        type: 'line',
        data: generateScenarioData().map(d => [d[0], d[2]]),
        lineStyle: { color: '#ff4d4f', width: 2 },
        itemStyle: { color: '#ff4d4f' },
        showSymbol: false,
        yAxisIndex: 1
      }
    ]
  }

  const centerPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>工况谱分析</h3>

      {/* Scenario Chart */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        padding: 20,
        marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.14)'
      }}>
        <ReactECharts option={scenarioChartOption} style={{ height: 300 }} />
        <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 12 }}>
          充电倍率: {scenario.chargeRate}C | 放电倍率: {scenario.dischargeRate}C | SOC窗口: {scenario.socMin}-{scenario.socMax}%
        </div>
      </div>

      {/* Top Stress Factors */}
      <div>
        <h4 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#fff' }}>关键应力因子</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: 'rgba(250,140,22,0.1)', borderRadius: 6, border: '1px solid rgba(250,140,22,0.3)' }}>
            <div style={{ fontSize: 12, color: '#fa8c16', marginBottom: 4 }}>温度应力</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>
              {scenario.tempMax > 40 ? '高' : '中'}
            </div>
          </div>
          <div style={{ padding: 16, background: 'rgba(24,144,255,0.1)', borderRadius: 6, border: '1px solid rgba(24,144,255,0.3)' }}>
            <div style={{ fontSize: 12, color: '#1890ff', marginBottom: 4 }}>倍率应力</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>
              {scenario.chargeRate > 2 ? '高' : '中'}
            </div>
          </div>
          <div style={{ padding: 16, background: 'rgba(82,196,26,0.1)', borderRadius: 6, border: '1px solid rgba(82,196,26,0.3)' }}>
            <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>SOC窗口</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
              {scenario.socMax - scenario.socMin}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const rightPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#fff' }}>分析结论</h3>

      <div style={{
        padding: 20,
        background: 'rgba(24,144,255,0.1)',
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid rgba(24,144,255,0.3)'
      }}>
        <div style={{ fontSize: 14, color: '#1890ff', fontWeight: 500, marginBottom: 8 }}>
          已识别关键应力因子
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
          {scenario.tempMax > 40 && <li>高温驻留风险 ({scenario.tempMax}°C)</li>}
          {scenario.chargeRate > 2 && <li>快充倍率应力 ({scenario.chargeRate}C)</li>}
          {scenario.socMax > 85 && <li>高 SOC 驻留 ({scenario.socMax}%)</li>}
          {scenario.tempMin < 0 && <li>低温充放电 ({scenario.tempMin}°C)</li>}
        </ul>
      </div>

      <div style={{
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 6,
        marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.14)'
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>适用场景</div>
        <div style={{ fontSize: 14, color: '#fff' }}>
          {scenario.type === 'fast_charging' && '车用快充场景'}
          {scenario.type === 'energy_storage' && '储能日循环场景'}
          {scenario.type === 'high_temp_storage' && '高温存储场景'}
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        block
        onClick={() => navigate('/select/s2')}
      >
        生成候选电芯列表
      </Button>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.92)' }}>Turbo-Select / 工况输入</h2>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          步骤 1/3: 输入应用工况参数，识别关键应力因子
        </div>
      </div>
      <ThreeColumnLayout
        leftPanel={leftPanel}
        centerPanel={centerPanel}
        rightPanel={rightPanel}
      />
    </div>
  )
}
