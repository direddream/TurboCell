import { ThreeColumnLayout } from '../../components/common/ThreeColumnLayout'
import { Button, Table } from 'antd'
import { DownloadOutlined, CheckCircleFilled, WarningFilled } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useSelect } from '../../contexts/SelectContext'

const avoidanceList = [
  {
    id: 1,
    condition: 'SOC 大于85% 且温度大于40°C',
    consequence: 'SEI膜加速增长，寿命衰减加快',
    action: '限制充电电流至 0.5C，启动主动冷却'
  },
  {
    id: 2,
    condition: '温度低于0°C充电',
    consequence: '锂析出风险增大',
    action: '预热至 5°C 以上后再充电，或降低充电倍率至 0.2C'
  },
  {
    id: 3,
    condition: 'SOC 低于20% 高倍率放电',
    consequence: '压降过大，可用容量受限',
    action: '限制放电功率，避免低 SOC 区域持续高倍率'
  },
  {
    id: 4,
    condition: '长期高 SOC 驻留 (大于90%)',
    consequence: '副反应增多，自放电加大',
    action: '建议设置 SOC 上限 85%，或定期均衡'
  }
]

export default function S3SOAStrategy() {
  const { selectedCell, cells } = useSelect()
  const cell = selectedCell || cells[0]

  const soaHeatmapOption = {
    tooltip: {
      position: 'top'
    },
    grid: {
      left: 80,
      right: 40,
      top: 40,
      bottom: 60
    },
    xAxis: {
      type: 'category',
      data: ['-20', '-10', '0', '10', '20', '30', '40', '50', '60'],
      name: '温度 (°C)',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'category',
      data: ['0.5C', '1C', '1.5C', '2C', '2.5C', '3C'],
      name: '充电倍率',
      nameLocation: 'middle',
      nameGap: 50
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#ff4d4f', '#fa8c16', '#fadb14', '#52c41a', '#1890ff']
      }
    },
    series: [{
      name: '可用容量 (%)',
      type: 'heatmap',
      data: [
        [0, 0, 45], [1, 0, 55], [2, 0, 65], [3, 0, 75], [4, 0, 85], [5, 0, 92], [6, 0, 95], [7, 0, 92], [8, 0, 85],
        [0, 1, 50], [1, 1, 62], [2, 1, 75], [3, 1, 85], [4, 1, 92], [5, 1, 96], [6, 1, 98], [7, 1, 95], [8, 1, 88],
        [0, 2, 55], [1, 2, 68], [2, 2, 80], [3, 2, 90], [4, 2, 95], [5, 2, 98], [6, 2, 96], [7, 2, 90], [8, 2, 82],
        [0, 3, 60], [1, 3, 73], [2, 3, 85], [3, 3, 93], [4, 3, 97], [5, 3, 99], [6, 3, 93], [7, 3, 85], [8, 3, 75],
        [0, 4, 62], [1, 4, 75], [2, 4, 87], [3, 4, 95], [4, 4, 98], [5, 4, 95], [6, 4, 88], [7, 4, 78], [8, 4, 68],
        [0, 5, 65], [1, 5, 78], [2, 5, 89], [3, 5, 96], [4, 5, 92], [5, 5, 85], [6, 5, 80], [7, 5, 70], [8, 5, 60]
      ],
      label: {
        show: true
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  const leftPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>电芯信息</h3>

      <div style={{
        padding: 16,
        background: '#fafafa',
        borderRadius: 6,
        marginBottom: 24
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{cell.model}</div>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{cell.manufacturer}</div>
        <div style={{ fontSize: 13, color: '#666' }}>
          <div>• 容量: {cell.model.match(/\d+Ah/)?.[0] || '50 Ah'}</div>
          <div>• 能量密度: {cell.energyDensity} Wh/kg</div>
          <div>• 标称电压: {cell.model.includes('LFP') ? '3.2V' : '3.65V'}</div>
          <div>• 温度范围: {cell.tempRange}</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>SOA 边界图例</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, background: '#1890ff', borderRadius: 3 }}></div>
            <span style={{ fontSize: 13, color: '#666' }}>最佳工作区 (95%+)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, background: '#52c41a', borderRadius: 3 }}></div>
            <span style={{ fontSize: 13, color: '#666' }}>良好工作区 (85-95%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, background: '#fadb14', borderRadius: 3 }}></div>
            <span style={{ fontSize: 13, color: '#666' }}>可用区 (70-85%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, background: '#fa8c16', borderRadius: 3 }}></div>
            <span style={{ fontSize: 13, color: '#666' }}>限制区 (50-70%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, background: '#ff4d4f', borderRadius: 3 }}></div>
            <span style={{ fontSize: 13, color: '#666' }}>禁止区 (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  )

  const centerPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>SOA 安全运行边界</h3>

      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>温度-倍率热力图</h4>
        <ReactECharts option={soaHeatmapOption} style={{ height: 400 }} />
      </div>

      <div>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
          <WarningFilled style={{ color: '#fa8c16', marginRight: 8 }} />
          避坑清单
        </h4>
        <Table
          dataSource={avoidanceList}
          pagination={false}
          size="small"
          rowKey="id"
          columns={[
            {
              title: '触发条件',
              dataIndex: 'condition',
              key: 'condition',
              width: '25%',
              render: (text) => <span style={{ fontSize: 13, fontWeight: 500 }}>{text}</span>
            },
            {
              title: '可能后果',
              dataIndex: 'consequence',
              key: 'consequence',
              width: '30%',
              render: (text) => <span style={{ fontSize: 13, color: '#666' }}>{text}</span>
            },
            {
              title: '建议动作',
              dataIndex: 'action',
              key: 'action',
              width: '45%',
              render: (text) => (
                <span style={{ fontSize: 13, color: '#1890ff', fontWeight: 500 }}>
                  <CheckCircleFilled style={{ marginRight: 6 }} />
                  {text}
                </span>
              )
            }
          ]}
        />
      </div>
    </div>
  )

  const rightPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>运行策略</h3>

      <div style={{
        padding: 20,
        background: '#e6f7ff',
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid #91d5ff'
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: '#1890ff' }}>
          推荐运行窗口
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>SOC 上限</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>85%</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>SOC 下限</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>15%</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>快充限流 (温度大于40°C)</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>0.8C</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>低温预热阈值</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>5°C</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>建议循环寿命</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>1500+ 次</div>
        </div>
      </div>

      <div style={{
        padding: 16,
        background: '#fff7e6',
        borderRadius: 6,
        marginBottom: 24,
        fontSize: 13,
        color: '#666'
      }}>
        <div style={{ fontWeight: 500, marginBottom: 8, color: '#fa8c16' }}>⚡ 重点提示</div>
        <div>• 避免高温高 SOC 同时出现</div>
        <div>• 低温充电需预热或降倍率</div>
        <div>• 建议定期均衡 (每 50 次循环)</div>
      </div>

      <Button
        type="primary"
        size="large"
        block
        icon={<DownloadOutlined />}
        style={{ marginBottom: 12 }}
      >
        生成选型与策略报告
      </Button>

      <Button
        size="large"
        block
      >
        保存到项目
      </Button>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>Turbo-Select / SOA边界与策略</h2>
        <div style={{ fontSize: 14, color: '#666' }}>
          步骤 3/3: 查看安全运行边界，获取可执行保护策略
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
