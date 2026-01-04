import { useState } from 'react'
import { Button, Tabs, Progress } from 'antd'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { ExperimentFilled, WarningFilled, BulbOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useDev } from '../../contexts/DevContext'

export default function D2Prediction() {
  const navigate = useNavigate()
  const { designParams, predictionResult, shouldTriggerOffline } = useDev()
  const [activeTab, setActiveTab] = useState('prediction')

  // 使用实际预测数据生成寿命曲线
  const result = predictionResult || {
    lifespanRange: { min: 1000, max: 1400 },
    confidence: 'medium' as const,
    intervalWidth: 30,
    keyRisks: [],
    contributionFactors: [],
    recommendation: '',
    gateTriggers: []
  }

  // 失效模式数据
  const failureModes = [
    { mode: 'LLI', name: '活性锂损失', probability: 65, color: '#ff6b6b', description: 'SEI膜生长持续消耗活性锂' },
    { mode: 'LAM_PE', name: '正极活性损失', probability: 25, color: '#fadb14', description: '颗粒开裂、结构相变导致' },
    { mode: 'LAM_NE', name: '负极活性损失', probability: 10, color: '#52c41a', description: '石墨剥离、析锂风险' }
  ]

  // 机理证据链
  const mechanismEvidence = {
    LLI: {
      phenomenon: '容量持续衰减，库伦效率略低于100%',
      indicators: ['dQ/dV峰位右移', 'EIS低频阻抗增大', '容量衰减呈√t规律'],
      mechanism: 'SEI膜在负极表面持续生长，消耗电解液中的锂离子',
      confidence: 'high'
    },
    LAM_PE: {
      phenomenon: '高倍率下容量衰减加速',
      indicators: ['dQ/dV正极峰强度下降', '内阻增长非线性', 'SEM可见颗粒裂纹'],
      mechanism: 'NCM材料高电压下晶格应力导致颗粒开裂，活性物质失效',
      confidence: 'medium'
    }
  }

  // 可执行策略参数
  const executionStrategies = [
    { category: '电压窗口', param: '截止电压', current: '4.2V', recommend: '4.15V (-50mV)', benefit: '寿命+15%', risk: '容量-3%' },
    { category: 'SOC窗口', param: '工作范围', current: '0-100%', recommend: '20-80%', benefit: '寿命+25%', risk: '可用能量-40%' },
    { category: '温度控制', param: '工作上限', current: '45°C', recommend: '38°C', benefit: '寿命+20%', risk: '需散热设计' },
    { category: '充电策略', param: '快充倍率', current: '2C', recommend: '1C CC-CV', benefit: '寿命+12%', risk: '充电时间+' }
  ]

  const midpoint = (result.lifespanRange.min + result.lifespanRange.max) / 2

  // 深色主题图表配置
  const lifeCurveOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'SOH 衰减曲线（预测区间）',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500, color: '#fff' }
    },
    grid: { left: 60, right: 40, top: 60, bottom: 60 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(20,30,50,0.9)',
      borderColor: 'rgba(255,255,255,0.2)',
      textStyle: { color: '#fff' },
      formatter: function (params: any) {
        const cycle = params[0]?.data[0]?.toFixed(0) || 0
        let result = `循环: ${cycle}<br/>`
        params.forEach((item: any) => {
          const value = item.data[1]?.toFixed(2) || 0
          result += `${item.marker} ${item.seriesName}: ${value}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['预测中值', '上界', '下界'],
      bottom: 10,
      textStyle: { color: 'rgba(255,255,255,0.65)' }
    },
    xAxis: {
      type: 'value',
      name: '循环次数',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    yAxis: {
      type: 'value',
      name: 'SOH (%)',
      min: 60,
      max: 100,
      nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [
      {
        name: '预测中值',
        type: 'line',
        data: Array.from({ length: Math.round(midpoint) }, (_, i) => [
          i,
          100 - (i / midpoint) * 20
        ]),
        lineStyle: { color: '#6ea8fe', width: 2 },
        showSymbol: false
      },
      {
        name: '上界',
        type: 'line',
        data: Array.from({ length: result.lifespanRange.max }, (_, i) => [
          i,
          100 - (i / result.lifespanRange.max) * 20
        ]),
        lineStyle: { color: '#3ddc97', width: 1, type: 'dashed' },
        showSymbol: false
      },
      {
        name: '下界',
        type: 'line',
        data: Array.from({ length: result.lifespanRange.min }, (_, i) => [
          i,
          100 - (i / result.lifespanRange.min) * 20
        ]),
        lineStyle: { color: '#ffcc66', width: 1, type: 'dashed' },
        showSymbol: false
      }
    ]
  }

  const confidenceConfig = {
    high: { text: 'High', color: '#3ddc97' },
    medium: { text: 'Med', color: '#fadb14' },
    low: { text: 'Low', color: '#ff6b6b' }
  }

  const currentConfidence = confidenceConfig[result.confidence]

  // 置信度仪表盘配置 - 修复字体重叠
  const confidenceGaugeOption = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 3,
      radius: '90%',
      center: ['50%', '70%'],
      axisLine: {
        lineStyle: {
          width: 16,
          color: [
            [0.33, '#ff6b6b'],  // Low - 红色
            [0.66, '#fadb14'],  // Med - 黄色
            [1, '#3ddc97']      // High - 绿色
          ]
        }
      },
      pointer: {
        icon: 'triangle',
        length: '55%',
        width: 6,
        offsetCenter: [0, '-15%'],
        itemStyle: {
          color: '#fff'
        }
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: {
        show: true,
        offsetCenter: [0, '5%'],
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)'
      },
      detail: {
        show: true,
        fontSize: 18,
        offsetCenter: [0, '35%'],
        valueAnimation: true,
        formatter: function () {
          return currentConfidence.text
        },
        color: currentConfidence.color,
        fontWeight: 700
      },
      data: [{
        value: result.confidence === 'high' ? 85 : result.confidence === 'medium' ? 50 : 15,
        name: 'Confidence'
      }]
    }]
  }

  // 卡片样式
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: 20
  }

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.92)' }}>
          Turbo-Dev / 极速预测
        </h2>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          步骤 2/3: 查看寿命预测结果和影响因子分析
        </div>
      </div>

      {/* 三列布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 20 }}>
        {/* 左侧：输入参数 */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600, color: '#fff' }}>输入参数</h3>

          <div style={{ marginBottom: 20 }}>
            <table className="responsive-table" style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                {[
                  { label: '化学体系', value: designParams.chemistry },
                  { label: '容量', value: `${designParams.capacity} Ah` },
                  { label: '能量密度', value: `${designParams.energyDensity} Wh/kg` },
                  { label: '工况', value: designParams.targetWorkload === 'fast_charging' ? '快充' : designParams.targetWorkload === 'high_power' ? '高功率' : '储能' },
                  { label: '目标寿命', value: `${designParams.targetCycles} cycles` }
                ].map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: '10px 0', color: 'rgba(255,255,255,0.5)' }}>{item.label}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 500, color: '#fff' }}>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            padding: 14,
            background: 'rgba(255,204,102,0.1)',
            borderRadius: 8,
            border: '1px solid rgba(255,204,102,0.3)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#ffcc66', marginBottom: 8 }}>
              在线预测说明
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              <li>基于数据库匹配</li>
              <li>经验公式外推</li>
              <li>无需寄样，即时获得结果</li>
              <li>预测时间: &lt;1分钟</li>
            </ul>
          </div>
        </div>

        {/* 中间：预测结果 + 机理分析 Tab 切换 */}
        <div style={cardStyle}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'prediction',
                label: <span><ThunderboltOutlined /> 预测结果</span>,
                children: (
                  <div>
                    {/* KPI 卡片 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                      <div style={{ padding: 14, background: 'rgba(110,168,254,0.1)', borderRadius: 8, border: '1px solid rgba(110,168,254,0.3)' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>预计寿命 (80% SOH)</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#6ea8fe' }}>
                          {result.lifespanRange.min}-{result.lifespanRange.max}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>cycles</div>
                      </div>
                      <div style={{ padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>置信度</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: currentConfidence.color }}>
                          {result.confidence === 'high' ? '高' : result.confidence === 'medium' ? '中' : '低'}
                        </div>
                      </div>
                      <div style={{ padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>区间宽度</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: result.intervalWidth < 25 ? '#3ddc97' : result.intervalWidth > 40 ? '#ff6b6b' : '#ffcc66' }}>
                          {result.intervalWidth}%
                        </div>
                      </div>
                    </div>

                    {/* 曲线图 */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                      <ReactECharts option={lifeCurveOption} style={{ height: 280 }} />
                    </div>

                    {/* 影响因子 */}
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#fff' }}>关键影响因子</h4>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 14 }}>
                        {result.contributionFactors.length > 0 ? (
                          result.contributionFactors.map((item, i) => {
                            const absContribution = Math.abs(item.contribution)
                            const color = absContribution > 25 ? '#ff6b6b' : absContribution > 15 ? '#ffcc66' : absContribution > 10 ? '#fadb14' : '#3ddc97'
                            return (
                              <div key={i} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{item.factor}</span>
                                  <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                                    {item.contribution > 0 ? '+' : ''}{item.contribution}%
                                  </span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ width: `${absContribution}%`, height: '100%', background: color }} />
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 20 }}>暂无数据</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'mechanism',
                label: <span><BulbOutlined /> 机理分析</span>,
                children: (
                  <div>
                    {/* 失效模式 Top3 */}
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <WarningFilled style={{ color: '#ff6b6b' }} />
                        失效模式预测 Top3
                      </h4>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 16 }}>
                        {failureModes.map((mode, i) => (
                          <div key={i} style={{ marginBottom: i < failureModes.length - 1 ? 16 : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  width: 20, height: 20, borderRadius: '50%',
                                  background: mode.color, color: '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 600
                                }}>{i + 1}</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{mode.name}</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>({mode.mode})</span>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 600, color: mode.color }}>{mode.probability}%</span>
                            </div>
                            <Progress
                              percent={mode.probability}
                              showInfo={false}
                              strokeColor={mode.color}
                              trailColor="rgba(255,255,255,0.1)"
                              size="small"
                            />
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{mode.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 机理证据链 */}
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <SafetyCertificateOutlined style={{ color: '#6ea8fe' }} />
                        机理证据链 (Mechanism Insight)
                      </h4>

                      {/* LLI 证据链 */}
                      <div style={{
                        background: 'rgba(255,107,107,0.08)',
                        border: '1px solid rgba(255,107,107,0.3)',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#ff6b6b' }}>LLI - 活性锂损失</span>
                          <span style={{
                            fontSize: 11, padding: '2px 8px',
                            background: 'rgba(255,107,107,0.2)', borderRadius: 4, color: '#ff6b6b'
                          }}>主失效模式</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
                          <strong style={{ color: '#fff' }}>现象：</strong>{mechanismEvidence.LLI.phenomenon}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
                          <strong style={{ color: '#fff' }}>关键指标：</strong>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            {mechanismEvidence.LLI.indicators.map((ind, j) => (
                              <span key={j} style={{
                                fontSize: 11, padding: '2px 8px',
                                background: 'rgba(255,255,255,0.1)', borderRadius: 4, color: 'rgba(255,255,255,0.85)'
                              }}>{ind}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                          <strong style={{ color: '#fff' }}>机理：</strong>{mechanismEvidence.LLI.mechanism}
                        </div>
                      </div>

                      {/* LAM_PE 证据链 */}
                      <div style={{
                        background: 'rgba(250,219,20,0.08)',
                        border: '1px solid rgba(250,219,20,0.3)',
                        borderRadius: 8,
                        padding: 16
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#fadb14' }}>LAM_PE - 正极活性损失</span>
                          <span style={{
                            fontSize: 11, padding: '2px 8px',
                            background: 'rgba(250,219,20,0.2)', borderRadius: 4, color: '#fadb14'
                          }}>次失效模式</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
                          <strong style={{ color: '#fff' }}>现象：</strong>{mechanismEvidence.LAM_PE.phenomenon}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
                          <strong style={{ color: '#fff' }}>关键指标：</strong>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            {mechanismEvidence.LAM_PE.indicators.map((ind, j) => (
                              <span key={j} style={{
                                fontSize: 11, padding: '2px 8px',
                                background: 'rgba(255,255,255,0.1)', borderRadius: 4, color: 'rgba(255,255,255,0.85)'
                              }}>{ind}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                          <strong style={{ color: '#fff' }}>机理：</strong>{mechanismEvidence.LAM_PE.mechanism}
                        </div>
                      </div>
                    </div>

                    {/* 可执行策略参数 */}
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ThunderboltOutlined style={{ color: '#3ddc97' }} />
                        可执行策略参数
                      </h4>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden' }}>
                        <table className="responsive-table" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>策略项</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>当前</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>建议</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>收益</th>
                            </tr>
                          </thead>
                          <tbody>
                            {executionStrategies.map((strategy, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <td style={{ padding: '10px 12px', color: '#fff' }}>
                                  <div style={{ fontWeight: 500 }}>{strategy.param}</div>
                                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{strategy.category}</div>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.65)' }}>{strategy.current}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6ea8fe', fontWeight: 500 }}>{strategy.recommend}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <span style={{ color: '#3ddc97', fontWeight: 500 }}>{strategy.benefit}</span>
                                  <div style={{ fontSize: 10, color: '#ff6b6b' }}>{strategy.risk}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              }
            ]}
            style={{ color: '#fff' }}
          />
        </div>

        {/* 右侧：预测结论 */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600, color: '#fff' }}>预测结论</h3>

          {/* 寿命范围 */}
          <div style={{
            padding: 16,
            background: 'rgba(110,168,254,0.1)',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(110,168,254,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#6ea8fe', marginBottom: 4 }}>预计寿命范围</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
              {result.lifespanRange.min}-{result.lifespanRange.max}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>cycles (至 80% SOH)</div>
          </div>

          {/* 置信度仪表盘 */}
          <div style={{
            padding: 12,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            marginBottom: 16
          }}>
            <ReactECharts option={confidenceGaugeOption} style={{ height: 120 }} />
            <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              当前结论适用于: <span style={{ color: '#fff' }}>方案筛选、方向判断</span>
            </div>
          </div>

          {/* 主要风险 */}
          {result.keyRisks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#fff' }}>主要风险</div>
              <div style={{
                padding: 12,
                background: 'rgba(255,107,107,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(255,107,107,0.3)'
              }}>
                {result.keyRisks.map((risk, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: i < result.keyRisks.length - 1 ? 6 : 0 }}>
                    • {risk}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gate 触发器 */}
          {shouldTriggerOffline && result.gateTriggers.length > 0 && (
            <div style={{
              padding: 16,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 8,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <WarningFilled style={{ fontSize: 20, color: '#fff' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>建议发起深度检测</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 12 }}>
                {result.gateTriggers.map((trigger, i) => (
                  <div key={i}>• {trigger}</div>
                ))}
              </div>
              <Button
                size="middle"
                block
                style={{ background: '#fff', color: '#764ba2', border: 'none', fontWeight: 500 }}
                onClick={() => navigate('/dev/d3')}
              >
                提升精度：发起深度检测
              </Button>
            </div>
          )}

          {/* VIP 服务 */}
          {!shouldTriggerOffline && (
            <div style={{
              padding: 14,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#fff' }}>
                <ExperimentFilled style={{ marginRight: 8, color: '#6ea8fe' }} />
                可选：VIP 深度检测
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                如需更高精度和工程背书，可升级至 VIP 深度检测服务
              </div>
              <Button
                block
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                onClick={() => navigate('/dev/d3')}
              >
                了解 VIP 服务
              </Button>
            </div>
          )}

          <Button
            size="large"
            block
            style={{ background: 'rgba(110,168,254,0.15)', border: '1px solid rgba(110,168,254,0.4)', color: '#6ea8fe', fontWeight: 500 }}
          >
            导出预测报告
          </Button>
        </div>
      </div>
    </div>
  )
}
