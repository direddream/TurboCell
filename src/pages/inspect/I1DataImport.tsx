import { useState } from 'react'
import { ThreeColumnLayout } from '../../components/common/ThreeColumnLayout'
import { Upload, Button, Table, Tag, Progress } from 'antd'
import { InboxOutlined, CheckCircleFilled, ClockCircleFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'

const { Dragger } = Upload

const sampleFiles = [
  {
    id: 1,
    name: 'BMS_Log_2024Q1.csv',
    type: 'BMS日志',
    size: '15.2 MB',
    records: 125000,
    status: 'parsed',
    uploadTime: '2024-01-15 14:23'
  },
  {
    id: 2,
    name: 'Cycle_Data_Pack01.xlsx',
    type: '循环记录',
    size: '8.7 MB',
    records: 450,
    status: 'parsed',
    uploadTime: '2024-01-15 14:25'
  },
  {
    id: 3,
    name: 'SOH_History.csv',
    type: 'SOH历史',
    size: '2.1 MB',
    records: 8500,
    status: 'parsing',
    uploadTime: '2024-01-15 14:27'
  }
]

export default function I1DataImport() {
  const navigate = useNavigate()
  const [uploadedFiles] = useState(sampleFiles)

  // 生成快速统计数据
  const quickStatsOption = {
    title: {
      text: 'SOC 分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(20,30,50,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' }
    },
    grid: { left: 60, right: 40, top: 60, bottom: 40 },
    xAxis: {
      type: 'category',
      data: ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'],
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' }
    },
    yAxis: {
      type: 'value',
      name: '样本数',
      nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      type: 'bar',
      data: [450, 1200, 2500, 3800, 5200, 4800, 3200, 2100, 1500, 800],
      itemStyle: {
        color: '#1890ff'
      }
    }]
  }

  const tempDistOption = {
    title: {
      text: '温度分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(20,30,50,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' }
    },
    grid: { left: 60, right: 40, top: 60, bottom: 40 },
    xAxis: {
      type: 'category',
      data: ['<0°C', '0-10°C', '10-20°C', '20-30°C', '30-40°C', '40-50°C', '>50°C'],
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' }
    },
    yAxis: {
      type: 'value',
      name: '样本数',
      nameTextStyle: { color: 'rgba(255,255,255,0.65)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      type: 'bar',
      data: [120, 850, 4500, 12000, 6500, 1200, 80],
      itemStyle: {
        color: '#ff4d4f'
      }
    }]
  }

  const leftPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>数据上传</h3>

      <Dragger
        name="file"
        multiple
        style={{ marginBottom: 24 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>点击或拖拽文件到此区域</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          支持 BMS 日志、循环记录、SOH 历史等格式
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          支持 .csv, .xlsx, .txt 格式
        </p>
      </Dragger>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>支持的数据类型</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Tag color="blue">BMS 运行日志</Tag>
          <Tag color="green">充放电循环数据</Tag>
          <Tag color="orange">SOH 历史记录</Tag>
          <Tag color="purple">电压/电流时序数据</Tag>
        </div>
      </div>

      <div style={{
        padding: 16,
        background: 'rgba(250,173,20,0.1)',
        borderRadius: 6,
        fontSize: 13,
        color: 'rgba(255,255,255,0.65)',
        border: '1px solid rgba(250,173,20,0.3)'
      }}>
        <div style={{ fontWeight: 500, marginBottom: 8, color: '#faad14' }}>💡 数据要求</div>
        <div>• 时间戳格式: YYYY-MM-DD HH:mm:ss</div>
        <div>• 必需字段: 电压、电流、温度、SOC</div>
        <div>• 建议数据量: 至少 100 次循环</div>
      </div>
    </div>
  )

  const centerPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>已上传文件</h3>

      <Table
        dataSource={uploadedFiles}
        pagination={false}
        size="small"
        rowKey="id"
        style={{ marginBottom: 32 }}
        className="dark-table"
        columns={[
          {
            title: '文件名',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{text}</span>
          },
          {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            render: (text) => <Tag color="blue">{text}</Tag>
          },
          {
            title: '大小',
            dataIndex: 'size',
            key: 'size',
            render: (text) => <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{text}</span>
          },
          {
            title: '记录数',
            dataIndex: 'records',
            key: 'records',
            render: (text) => <span style={{ fontSize: 13, color: '#666' }}>{text.toLocaleString()}</span>
          },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
              status === 'parsed'
                ? <Tag icon={<CheckCircleFilled />} color="success">已解析</Tag>
                : <Tag icon={<ClockCircleFilled />} color="processing">解析中</Tag>
            )
          }
        ]}
      />

      <div>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>快速统计</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <ReactECharts option={quickStatsOption} style={{ height: 240 }} />
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <ReactECharts option={tempDistOption} style={{ height: 240 }} />
          </div>
        </div>
      </div>
    </div>
  )

  const rightPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>数据质量</h3>

      <div style={{
        padding: 20,
        background: 'rgba(82,196,26,0.1)',
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid rgba(82,196,26,0.3)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: '#52c41a' }}>
          整体评分: 92 / 100
        </div>
        <Progress percent={92} strokeColor="#52c41a" trailColor="rgba(255,255,255,0.1)" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>质量指标</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>完整性</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>98%</span>
            </div>
            <Progress percent={98} size="small" strokeColor="#52c41a" trailColor="rgba(255,255,255,0.1)" showInfo={false} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>一致性</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>95%</span>
            </div>
            <Progress percent={95} size="small" strokeColor="#52c41a" trailColor="rgba(255,255,255,0.1)" showInfo={false} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>时序连续性</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>88%</span>
            </div>
            <Progress percent={88} size="small" strokeColor="#fadb14" trailColor="rgba(255,255,255,0.1)" showInfo={false} />
          </div>
        </div>
      </div>

      <div style={{
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 6,
        marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>数据摘要</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
          <div>• 总循环次数: 450</div>
          <div>• 时间跨度: 2023-03-01 ~ 2024-01-15</div>
          <div>• 温度范围: -5°C ~ 52°C</div>
          <div>• SOC 范围: 3% ~ 98%</div>
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        block
        onClick={() => navigate('/inspect/i2')}
      >
        开始健康评估
      </Button>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.92)' }}>Turbo-Inspect / 数据导入</h2>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          步骤 1/3: 上传电芯运行数据,验证数据质量
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
