import { useEffect, useState } from 'react'
import { InputNumber, Select, Button, Upload, Progress } from 'antd'
import { UploadOutlined, RocketOutlined, ExperimentOutlined, CheckCircleFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDev } from '../../contexts/DevContext'

export default function D1CellInput() {
  const navigate = useNavigate()
  const { designParams, setDesignParams } = useDev()
  const [completeness] = useState(80)

  // 计算能量密度
  const calculateEnergyDensity = () => {
    const baseEnergy: Record<string, number> = {
      NCM811: 280,
      NCM523: 240,
      LFP: 170,
      LTO: 90,
      NCA: 270
    }
    return baseEnergy[designParams.chemistry] || 240
  }

  useEffect(() => {
    const energyDensity = calculateEnergyDensity()
    setDesignParams({
      ...designParams,
      energyDensity
    })
  }, [designParams.chemistry])

  // 深色卡片样式
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: 20
  }

  // 深色输入框样式
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8
  }

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.92)' }}>
          Turbo-Dev / 参数输入
        </h2>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          步骤 1/3: 输入电芯设计参数，准备进行寿命预测
        </div>
      </div>

      {/* 三列布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: 20 }}>
        {/* 左侧：电芯参数输入 */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600, color: '#fff' }}>电芯参数输入</h3>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              化学体系
            </label>
            <Select
              value={designParams.chemistry}
              onChange={(value) => setDesignParams({ ...designParams, chemistry: value as any })}
              style={{ width: '100%' }}
              popupClassName="dark-select-dropdown"
              options={[
                { value: 'NCM811', label: 'NCM811 (高能量密度)' },
                { value: 'NCM523', label: 'NCM523 (平衡型)' },
                { value: 'LFP', label: 'LFP (高安全性)' },
                { value: 'NCA', label: 'NCA (高性能)' },
                { value: 'LTO', label: 'LTO (超长寿命)' }
              ]}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              标称容量 (Ah)
            </label>
            <InputNumber
              value={designParams.capacity}
              onChange={(value) => setDesignParams({ ...designParams, capacity: value || 50 })}
              style={{ width: '100%', ...inputStyle }}
              min={1}
              max={300}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              能量密度 (Wh/kg)
            </label>
            <InputNumber
              value={designParams.energyDensity}
              onChange={(value) => setDesignParams({ ...designParams, energyDensity: value || 240 })}
              style={{ width: '100%', ...inputStyle }}
              min={80}
              max={350}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              正极厚度 (μm)
            </label>
            <InputNumber
              value={designParams.cathodeThickness}
              onChange={(value) => setDesignParams({ ...designParams, cathodeThickness: value || 75 })}
              style={{ width: '100%', ...inputStyle }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              负极厚度 (μm)
            </label>
            <InputNumber
              value={designParams.anodeThickness}
              onChange={(value) => setDesignParams({ ...designParams, anodeThickness: value || 80 })}
              style={{ width: '100%', ...inputStyle }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              目标工况
            </label>
            <Select
              value={designParams.targetWorkload}
              onChange={(value) => setDesignParams({ ...designParams, targetWorkload: value as any })}
              style={{ width: '100%' }}
              popupClassName="dark-select-dropdown"
              options={[
                { value: 'fast_charging', label: '快充工况' },
                { value: 'high_power', label: '高功率工况' },
                { value: 'energy_storage', label: '储能循环' }
              ]}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              目标寿命 (cycles)
            </label>
            <InputNumber
              value={designParams.targetCycles}
              onChange={(value) => setDesignParams({ ...designParams, targetCycles: value || 1500 })}
              style={{ width: '100%', ...inputStyle }}
              min={500}
              max={5000}
              step={100}
            />
          </div>
        </div>

        {/* 中间：参数完整度 + 摘要 */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600, color: '#fff' }}>参数完整度</h3>

          {/* 进度条 */}
          <div style={{
            padding: 20,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            marginBottom: 20
          }}>
            <Progress
              percent={completeness}
              strokeColor={{
                '0%': '#6ea8fe',
                '100%': '#3ddc97'
              }}
              trailColor="rgba(255,255,255,0.1)"
              style={{ marginBottom: 12 }}
            />
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>
              已完成 <span style={{ color: '#3ddc97', fontWeight: 600 }}>{completeness}%</span> 的必填参数
            </div>
          </div>

          {/* 参数摘要卡片组 */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#fff' }}>参数摘要</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{
                padding: 14,
                background: 'rgba(110,168,254,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(110,168,254,0.3)'
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>化学体系</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#6ea8fe' }}>{designParams.chemistry}</div>
              </div>
              <div style={{
                padding: 14,
                background: 'rgba(61,220,151,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(61,220,151,0.3)'
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>容量</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#3ddc97' }}>{designParams.capacity} Ah</div>
              </div>
              <div style={{
                padding: 14,
                background: 'rgba(255,204,102,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(255,204,102,0.3)'
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>能量密度</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#ffcc66' }}>{designParams.energyDensity} Wh/kg</div>
              </div>
              <div style={{
                padding: 14,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.14)'
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>目标寿命</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{designParams.targetCycles} cycles</div>
              </div>
            </div>
          </div>

          {/* 详细参数表格 */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20
          }}>
            <table className="responsive-table" style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                {[
                  { label: '正极厚度', value: `${designParams.cathodeThickness} μm` },
                  { label: '负极厚度', value: `${designParams.anodeThickness} μm` },
                  { label: '目标工况', value: designParams.targetWorkload === 'fast_charging' ? '快充工况' : designParams.targetWorkload === 'high_power' ? '高功率工况' : '储能循环' }
                ].map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: '10px 0', color: 'rgba(255,255,255,0.5)' }}>{item.label}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 500, color: '#fff' }}>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 导入参数表 */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#fff' }}>或导入参数表</h4>
            <Upload>
              <Button
                icon={<UploadOutlined />}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: 'rgba(255,255,255,0.85)'
                }}
              >
                上传 Excel/CSV 参数表
              </Button>
            </Upload>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
              支持格式：.xlsx, .csv
            </div>
          </div>
        </div>

        {/* 右侧：下一步门控 */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600, color: '#fff' }}>下一步</h3>

          {/* 状态提示 */}
          <div style={{
            padding: 16,
            background: completeness >= 70 ? 'rgba(61,220,151,0.1)' : 'rgba(255,204,102,0.1)',
            borderRadius: 8,
            marginBottom: 20,
            border: `1px solid ${completeness >= 70 ? 'rgba(61,220,151,0.3)' : 'rgba(255,204,102,0.3)'}`
          }}>
            <div style={{
              fontSize: 14,
              color: completeness >= 70 ? '#3ddc97' : '#ffcc66',
              fontWeight: 500,
              marginBottom: 8
            }}>
              {completeness >= 70 ? <><CheckCircleFilled /> 参数已满足最低要求</> : '⚠ 需要补充更多参数'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              {completeness >= 70
                ? '可以进行在线极速预测，或升级 VIP 获得更精准的结果'
                : '建议补充极片参数、电解液配方等信息以提高预测准确度'}
            </div>
          </div>

          {/* 预测模式说明 */}
          <div style={{
            padding: 16,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            marginBottom: 20
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>选择预测模式</div>

            {/* 在线预测 */}
            <div style={{
              padding: 14,
              background: 'rgba(110,168,254,0.1)',
              borderRadius: 8,
              marginBottom: 12,
              border: '1px solid rgba(110,168,254,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <RocketOutlined style={{ fontSize: 18, color: '#6ea8fe' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>在线极速预测</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                <li>基于数据库匹配</li>
                <li>经验公式外推</li>
                <li>无需寄样，即时获得结果</li>
                <li>预测时间: &lt;1分钟</li>
              </ul>
            </div>

            {/* VIP 深度检测 */}
            <div style={{
              padding: 14,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <ExperimentOutlined style={{ fontSize: 18, color: '#3ddc97' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>VIP 深度检测</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                <li>短测试 + 仿真 + PIML</li>
                <li>置信度提升至 90%+</li>
                <li>区间收窄至 ±5%</li>
                <li>机理定位与工程建议</li>
              </ul>
            </div>
          </div>

          {/* 操作按钮 */}
          <Button
            type="primary"
            size="large"
            block
            onClick={() => navigate('/dev/d2')}
            disabled={completeness < 50}
            style={{
              height: 48,
              fontWeight: 500,
              background: '#6ea8fe',
              borderColor: '#6ea8fe',
              marginBottom: 12
            }}
          >
            <RocketOutlined /> 极速预测 (Online)
          </Button>

          <Button
            size="large"
            block
            onClick={() => navigate('/dev/d3')}
            style={{
              height: 48,
              fontWeight: 500,
              background: 'rgba(61,220,151,0.15)',
              border: '1px solid rgba(61,220,151,0.4)',
              color: '#3ddc97'
            }}
          >
            <ExperimentOutlined /> 提升精度 (VIP 线下)
          </Button>
        </div>
      </div>
    </div>
  )
}
