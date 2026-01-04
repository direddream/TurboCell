import { useState } from 'react'
import { ThreeColumnLayout } from '../../components/common/ThreeColumnLayout'
import { Button, Progress, Tag, Modal } from 'antd'
import { WarningOutlined, CheckCircleOutlined, CrownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { KPITile } from '../../components/common/KPITile'

const healthMetrics = [
  { name: '容量保持率', value: 87.5, unit: '%', status: 'good' },
  { name: '内阻增长率', value: 24.3, unit: '%', status: 'warning' },
  { name: '自放电率', value: 2.8, unit: '%/月', status: 'good' },
  { name: '温升异常', value: 0, unit: '次', status: 'good' }
]

const cellGrades = [
  { id: 'A001', grade: 'A', soh: 95, rul: 850, riskLevel: 'low' },
  { id: 'A002', grade: 'B', soh: 88, rul: 620, riskLevel: 'medium' },
  { id: 'A003', grade: 'A', soh: 93, rul: 780, riskLevel: 'low' },
  { id: 'A004', grade: 'C', soh: 76, rul: 350, riskLevel: 'high' },
  { id: 'A005', grade: 'B', soh: 85, rul: 580, riskLevel: 'medium' }
]

export default function I2HealthAssessment() {
  const navigate = useNavigate()
  const [selectedCell] = useState('A002')
  const [vipModalOpen, setVipModalOpen] = useState(false)

  // SOH 历史曲线
  const sohHistoryOption = {
    title: {
      text: 'SOH 衰减曲线',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20,30,50,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const point = params[0]
        return `循环: ${point.data[0]}<br/>SOH: ${point.data[1]}%`
      }
    },
    grid: { left: 60, right: 40, top: 60, bottom: 60 },
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
      min: 70,
      max: 100,
      nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [
      {
        name: 'SOH',
        type: 'line',
        data: [
          [0, 100], [50, 98.5], [100, 97.2], [150, 95.8], [200, 94.5],
          [250, 93.1], [300, 91.8], [350, 90.2], [400, 88.5], [450, 87.5]
        ],
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
        smooth: true,
        markLine: {
          data: [
            { yAxis: 80, lineStyle: { color: '#ff4d4f', type: 'dashed' }, label: { formatter: 'EOL (80%)', color: '#ff4d4f' } }
          ]
        }
      }
    ]
  }

  // RUL 预测曲线
  const rulPredictionOption = {
    title: {
      text: 'RUL 预测',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20,30,50,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' }
    },
    grid: { left: 60, right: 40, top: 60, bottom: 60 },
    xAxis: {
      type: 'value',
      name: '当前循环',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    yAxis: {
      type: 'value',
      name: 'RUL (cycles)',
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [
      {
        name: '预测RUL',
        type: 'line',
        data: [
          [100, 920], [150, 850], [200, 780], [250, 720], [300, 660],
          [350, 640], [400, 625], [450, 620]
        ],
        lineStyle: { color: '#52c41a', width: 2 },
        itemStyle: { color: '#52c41a' },
        smooth: true,
        areaStyle: {
          color: 'rgba(82, 196, 26, 0.1)'
        }
      },
      {
        name: '置信上界',
        type: 'line',
        data: [
          [100, 1050], [150, 970], [200, 890], [250, 820], [300, 760],
          [350, 730], [400, 710], [450, 700]
        ],
        lineStyle: { color: '#52c41a', width: 1, type: 'dashed' },
        itemStyle: { color: 'transparent' },
        smooth: true
      },
      {
        name: '置信下界',
        type: 'line',
        data: [
          [100, 790], [150, 730], [200, 670], [250, 620], [300, 560],
          [350, 550], [400, 540], [450, 540]
        ],
        lineStyle: { color: '#52c41a', width: 1, type: 'dashed' },
        itemStyle: { color: 'transparent' },
        smooth: true
      }
    ]
  }

  const leftPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>电芯列表</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cellGrades.map((cell) => (
          <div
            key={cell.id}
            style={{
              padding: 16,
              background: selectedCell === cell.id ? 'rgba(24,144,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: selectedCell === cell.id ? '2px solid #1890ff' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{cell.id}</span>
              <Tag color={
                cell.grade === 'A' ? 'green' :
                  cell.grade === 'B' ? 'blue' :
                    cell.grade === 'C' ? 'orange' : 'red'
              }>
                {cell.grade} 级
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              <div>SOH: {cell.soh}%</div>
              <div>RUL: {cell.rul} cycles</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: 16,
        background: 'rgba(250,173,20,0.1)',
        borderRadius: 6,
        marginTop: 24,
        fontSize: 13,
        color: 'rgba(255,255,255,0.65)',
        border: '1px solid rgba(250,173,20,0.3)'
      }}>
        <div style={{ fontWeight: 500, marginBottom: 8, color: '#faad14' }}>🏆 分级标准</div>
        <div>• A级: SOH 90%+, 低风险</div>
        <div>• B级: SOH 80-90%, 中风险</div>
        <div>• C级: SOH 70-80%, 高风险</div>
        <div>• D级: SOH 70%-, 淘汰</div>
      </div>
    </div>
  )

  const centerPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>健康评估 - {selectedCell}</h3>

      {/* Health Score */}
      <div style={{
        padding: 24,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>综合健康评分</div>
        <div style={{ fontSize: 48, fontWeight: 600, color: '#1890ff', marginBottom: 16 }}>88</div>
        <Progress percent={88} strokeColor="#1890ff" trailColor="rgba(255,255,255,0.1)" showInfo={false} />
        <div style={{ marginTop: 16 }}>
          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>B 级</Tag>
        </div>
      </div>

      {/* Health Metrics */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>关键指标</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {healthMetrics.map((metric) => (
            <div
              key={metric.name}
              style={{
                padding: 16,
                background: metric.status === 'good' ? 'rgba(82,196,26,0.1)' : 'rgba(250,173,20,0.1)',
                border: metric.status === 'good' ? '1px solid rgba(82,196,26,0.3)' : '1px solid rgba(250,173,20,0.3)',
                borderRadius: 6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>{metric.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>
                    {metric.value}{metric.unit}
                  </div>
                </div>
                {metric.status === 'good' ? (
                  <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                ) : (
                  <WarningOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <ReactECharts option={sohHistoryOption} style={{ height: 260 }} />
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <ReactECharts option={rulPredictionOption} style={{ height: 260 }} />
        </div>
      </div>
    </div>
  )

  const rightPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>风险评估</h3>

      <div style={{
        padding: 20,
        background: 'rgba(250,173,20,0.1)',
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid rgba(250,173,20,0.3)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: '#faad14' }}>
          风险等级: 中风险
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
          <div>• 内阻增长较快 (+24.3%)</div>
          <div>• SOH 接近 B/C 分界线</div>
          <div>• RUL 置信区间较宽</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>KPI 摘要</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <KPITile
            label="当前 SOH"
            value={87.5}
            unit="%"
            color="#1890ff"
            trend="down"
          />
          <KPITile
            label="预测 RUL"
            value={620}
            unit="cycles"
            color="#52c41a"
          />
          <KPITile
            label="衰减速率"
            value={0.028}
            unit="%/cycle"
            color="#ff4d4f"
            trend="up"
          />
        </div>
      </div>

      <div style={{
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 6,
        marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>建议措施</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
          <div>• 增加监测频率至每周</div>
          <div>• 避免高倍率充放电</div>
          <div>• 控制工作温度 20-30°C</div>
          <div>• 建议 200 次循环后复检</div>
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        block
        icon={<CrownOutlined />}
        onClick={() => setVipModalOpen(true)}
        style={{ background: 'linear-gradient(135deg, #f5a623 0%, #f78e1e 100%)', borderColor: '#f5a623' }}
      >
        故障诊断与分拣 (VIP)
      </Button>

      <Modal
        open={vipModalOpen}
        onCancel={() => setVipModalOpen(false)}
        footer={null}
        centered
        width={420}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CrownOutlined style={{ fontSize: 64, color: '#f5a623', marginBottom: 24 }} />
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>升级 VIP 服务</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.8 }}>
            故障诊断与分拣功能需要 VIP 权限<br/>
            包含衰减机理分析、根因树、多模态表征、分拣建议等高级功能
          </p>
          <div style={{
            background: '#fff7e6',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: 500, marginBottom: 12, color: '#fa8c16' }}>VIP 功能包含:</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 2 }}>
              <div>✓ 衰减机理贡献度分析</div>
              <div>✓ 根因树追溯定位</div>
              <div>✓ 动态证据链推理</div>
              <div>✓ 多模态有损/无损表征报告</div>
              <div>✓ 智能分拣与处置建议</div>
              <div>✓ 定责线索汇总</div>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            block
            style={{ background: 'linear-gradient(135deg, #f5a623 0%, #f78e1e 100%)', borderColor: '#f5a623', height: 48 }}
          >
            联系销售升级 VIP
          </Button>
          <Button
            type="link"
            size="large"
            block
            onClick={() => {
              setVipModalOpen(false)
              navigate('/inspect/i3')
            }}
            style={{ marginTop: 8 }}
          >
            先体验一下 →
          </Button>
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            或拨打: 400-xxx-xxxx
          </div>
        </div>
      </Modal>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>Turbo-Inspect / 健康评估</h2>
        <div style={{ fontSize: 14, color: '#666' }}>
          步骤 2/3: 计算健康评分,预测剩余寿命
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
