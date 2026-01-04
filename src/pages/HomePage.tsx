import { Link } from 'react-router-dom'
import { RocketOutlined, ExperimentOutlined, SafetyOutlined, ArrowRightOutlined, ThunderboltOutlined, AimOutlined } from '@ant-design/icons'

export default function HomePage() {
  const cardStyle: React.CSSProperties = {
    padding: 32,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    transition: 'all 0.3s',
    cursor: 'pointer',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))'
  }

  const tagStyle = (color: string, bg: string): React.CSSProperties => ({
    padding: '4px 12px',
    background: bg,
    color: color,
    borderRadius: 4,
    fontSize: 12,
    border: `1px solid ${color}33`
  })

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '48px 24px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 style={{ fontSize: 48, fontWeight: 600, marginBottom: 16, color: 'rgba(255,255,255,0.92)' }}>
          TurboCell 极速芯研
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', maxWidth: 800, margin: '0 auto' }}>
          面向电池全生命周期的工程智能平台，提供选型与边界评估、研发加速、在役/退役评估与诊断的标准化交付
        </p>
      </div>

      {/* Turbo-Select 双入口卡片 */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <RocketOutlined style={{ fontSize: 28, color: '#6ea8fe' }} />
          <h2 style={{ fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.92)', margin: 0 }}>Turbo-Select</h2>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>选型与边界评估</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* 左入口: Scenario → Cell */}
          <Link to="/select/scenario-to-cell" style={{ textDecoration: 'none' }}>
            <div style={{
              ...cardStyle,
              borderColor: 'rgba(110,168,254,0.3)',
              background: 'linear-gradient(135deg, rgba(110,168,254,0.08), rgba(255,255,255,0.03))'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(110,168,254,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThunderboltOutlined style={{ fontSize: 24, color: '#6ea8fe' }} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>从工况开始</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Scenario → Cell</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 20, minHeight: 40 }}>
                输入应用工况参数（温度、倍率、SOC窗口），系统自动筛选匹配电芯并排序
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                <span style={tagStyle('#6ea8fe', 'rgba(110,168,254,0.12)')}>工况谱分析</span>
                <span style={tagStyle('#6ea8fe', 'rgba(110,168,254,0.12)')}>候选排序</span>
                <span style={tagStyle('#6ea8fe', 'rgba(110,168,254,0.12)')}>Top5推荐</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#6ea8fe',
                fontWeight: 500
              }}>
                开始选型 <ArrowRightOutlined />
              </div>
            </div>
          </Link>

          {/* 右入口: Cell → Scenario */}
          <Link to="/select/cell-to-scenario" style={{ textDecoration: 'none' }}>
            <div style={{
              ...cardStyle,
              borderColor: 'rgba(61,220,151,0.3)',
              background: 'linear-gradient(135deg, rgba(61,220,151,0.08), rgba(255,255,255,0.03))'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(61,220,151,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AimOutlined style={{ fontSize: 24, color: '#3ddc97' }} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>从电芯开始</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Cell → Scenario</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 20, minHeight: 40 }}>
                选择电芯型号，输出 SOA 安全边界热力图、推荐 SOC 窗口、限流策略表
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                <span style={tagStyle('#3ddc97', 'rgba(61,220,151,0.12)')}>SOA热力图</span>
                <span style={tagStyle('#3ddc97', 'rgba(61,220,151,0.12)')}>SOC窗口</span>
                <span style={tagStyle('#3ddc97', 'rgba(61,220,151,0.12)')}>BMS策略</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#3ddc97',
                fontWeight: 500
              }}>
                边界评估 <ArrowRightOutlined />
              </div>
            </div>
          </Link>
        </div>

        {/* 底部小链接 */}
        <div style={{ marginTop: 16, display: 'flex', gap: 24, justifyContent: 'center' }}>
          <Link to="/select/s1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>步骤式选型流程</Link>
          <Link to="/select" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>统一工作台</Link>
        </div>
      </div>

      {/* Other Product Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 64 }}>
        {/* Turbo-Dev */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 24, color: '#3ddc97', fontSize: 40 }}>
            <ExperimentOutlined />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: 'rgba(255,255,255,0.92)' }}>Turbo-Dev</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 20, minHeight: 48 }}>
            研发加速与工艺优化
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            <span style={tagStyle('#3ddc97', 'rgba(61,220,151,0.12)')}>寿命预测</span>
            <span style={tagStyle('#3ddc97', 'rgba(61,220,151,0.12)')}>工艺优化</span>
            <span style={tagStyle('#3ddc97', 'rgba(61,220,151,0.12)')}>深度验证</span>
          </div>
          <Link
            to="/dev/d1"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: '#3ddc97',
              color: '#0b1220',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            开始研发
          </Link>
        </div>

        {/* Turbo-Inspect */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 24, color: '#ffcc66', fontSize: 40 }}>
            <SafetyOutlined />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: 'rgba(255,255,255,0.92)' }}>Turbo-Inspect</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 20, minHeight: 48 }}>
            在役/退役评估与诊断
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            <span style={tagStyle('#ffcc66', 'rgba(255,204,102,0.12)')}>健康评估</span>
            <span style={tagStyle('#ffcc66', 'rgba(255,204,102,0.12)')}>故障诊断</span>
            <span style={tagStyle('#ffcc66', 'rgba(255,204,102,0.12)')}>分流建议</span>
          </div>
          <Link
            to="/inspect/i1"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: '#ffcc66',
              color: '#0b1220',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            开始评估
          </Link>
        </div>
      </div>

      {/* Demo Cases Section */}
      <div style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: 'rgba(255,255,255,0.92)' }}>一分钟案例</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {['快充车选型演示', '新体系寿命预测', '退役包评估'].map((title, i) => (
            <button key={i} style={{
              padding: '16px 24px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              textAlign: 'left',
              transition: 'all 0.3s',
              color: 'rgba(255,255,255,0.85)'
            }}>
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Deliverables */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: 'rgba(255,255,255,0.92)' }}>最近交付</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { title: '某新能源车快充选型报告', date: '2025-12-20', type: 'Turbo-Select', color: '#6ea8fe' },
            { title: 'LFP 新体系寿命验证', date: '2025-12-18', type: 'Turbo-Dev', color: '#3ddc97' },
            { title: '退役电池包健康评估', date: '2025-12-15', type: 'Turbo-Inspect', color: '#ffcc66' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: 14, color: item.color, marginBottom: 8 }}>{item.type}</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.92)' }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{item.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
