import { useState, useEffect } from 'react'
import { ThreeColumnLayout } from '../../components/common/ThreeColumnLayout'
import { RiskTag } from '../../components/common/RiskTag'
import { Button, Radio } from 'antd'
import { useNavigate } from 'react-router-dom'
import { CheckCircleFilled, ThunderboltFilled, FireFilled } from '@ant-design/icons'
import { useSelect } from '../../contexts/SelectContext'

export default function S2Recommendation() {
  const navigate = useNavigate()
  const { scenario, cells, selectedCell, setSelectedCell } = useSelect()
  const [selectedCells, setSelectedCells] = useState<number[]>([])

  // 自动选择第一个电芯
  useEffect(() => {
    if (cells.length > 0) {
      setSelectedCells([cells[0].id])
      if (!selectedCell) {
        setSelectedCell(cells[0])
      }
    }
  }, [cells, selectedCell, setSelectedCell])

  const leftPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>筛选条件</h3>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
          化学体系
        </label>
        <Radio.Group defaultValue="all" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Radio value="all">全部</Radio>
          <Radio value="ncm">三元 (NCM)</Radio>
          <Radio value="lfp">磷酸铁锂 (LFP)</Radio>
          <Radio value="lto">钛酸锂 (LTO)</Radio>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
          风险等级
        </label>
        <Radio.Group defaultValue="all" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Radio value="all">全部</Radio>
          <Radio value="low">仅低风险</Radio>
          <Radio value="medium">中低风险</Radio>
        </Radio.Group>
      </div>

      <div style={{
        padding: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        marginTop: 32
      }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>当前工况</div>
        <div style={{ fontSize: 13, color: '#666' }}>
          <div>• {scenario.type === 'fast_charging' ? '车用快充' : scenario.type === 'energy_storage' ? '储能日循环' : '高温存储'}</div>
          <div>• 温度: {scenario.tempMin}~{scenario.tempMax}°C</div>
          <div>• 充电: {scenario.chargeRate}C</div>
          <div>• SOC: {scenario.socMin}~{scenario.socMax}%</div>
        </div>
      </div>
    </div>
  )

  const centerPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>
        Top 5 推荐电芯
        <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 12 }}>
          按适配度排序
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cells.map((cell, index) => (
          <div
            key={cell.id}
            style={{
              padding: 20,
              background: selectedCells.includes(cell.id) ? 'var(--bg-info)' : 'var(--bg-card)',
              border: selectedCells.includes(cell.id) ? '2px solid var(--border-info)' : '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onClick={() => {
              if (selectedCells.includes(cell.id)) {
                setSelectedCells(selectedCells.filter(id => id !== cell.id))
                if (selectedCell?.id === cell.id) {
                  setSelectedCell(cells[0])
                }
              } else if (selectedCells.length < 3) {
                setSelectedCells([...selectedCells, cell.id])
                if (index === 0) {
                  setSelectedCell(cell)
                }
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'rgba(255,255,255,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 600,
                  color: index < 3 ? 'var(--bg-page)' : 'var(--text-muted)'
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{cell.model}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{cell.manufacturer}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{cell.score}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>适配度</div>
                </div>
                <RiskTag level={cell.risk} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>推荐理由</div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#666' }}>
                {cell.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>能量密度</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{cell.energyDensity} Wh/kg</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>温度范围</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{cell.tempRange}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>倍率能力</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{cell.rateCapability}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>单价</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{cell.cost}</div>
              </div>
            </div>

            {selectedCells.includes(cell.id) && (
              <div style={{
                marginTop: 12,
                padding: 8,
                background: '#1890ff',
                color: 'white',
                borderRadius: 4,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <CheckCircleFilled /> 已选择用于对比
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedCells.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
            电芯对比 ({selectedCells.length}/3)
          </h4>
          <div style={{ overflow: 'auto' }}>
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>项目</th>
                  {selectedCells.map(id => {
                    const cell = cells.find(c => c.id === id)!
                    return <th key={id} style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{cell.model}</th>
                  })}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: 12, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>适配度</td>
                  {selectedCells.map(id => {
                    const cell = cells.find(c => c.id === id)!
                    return <td key={id} style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#1890ff' }}>{cell.score}</td>
                  })}
                </tr>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: 12, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>能量密度</td>
                  {selectedCells.map(id => {
                    const cell = cells.find(c => c.id === id)!
                    return <td key={id} style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#fff' }}>{cell.energyDensity} Wh/kg</td>
                  })}
                </tr>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: 12, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>倍率能力</td>
                  {selectedCells.map(id => {
                    const cell = cells.find(c => c.id === id)!
                    return <td key={id} style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#fff' }}>{cell.rateCapability}</td>
                  })}
                </tr>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: 12, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>单价</td>
                  {selectedCells.map(id => {
                    const cell = cells.find(c => c.id === id)!
                    return <td key={id} style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#fff' }}>{cell.cost}</td>
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const bestCell = cells[0] || cells[0]
  const rightPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>推荐结论</h3>

      <div style={{
        padding: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 8,
        marginBottom: 24,
        color: 'white'
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>最佳候选</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{bestCell.model}</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>适配度: {bestCell.score} 分</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThunderboltFilled style={{ color: '#52c41a' }} /> 主要优势
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#666' }}>
          {bestCell.reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FireFilled style={{ color: '#fa8c16' }} /> 主要风险
        </div>
        <div style={{ padding: 12, background: 'rgba(250,140,22,0.1)', borderRadius: 6, fontSize: 13, color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(250,140,22,0.3)' }}>
          高 SOC 高温驻留需要保护策略
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        block
        onClick={() => navigate('/select/s3')}
      >
        查看 SOA 边界与策略
      </Button>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.92)' }}>Turbo-Select / 推荐结果</h2>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          步骤 2/3: 查看候选电芯列表，选择最佳匹配
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
