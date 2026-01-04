import { ArrowRightOutlined } from '@ant-design/icons'

interface Evidence {
  phenomenon: string
  indicator: string
  inference: string
}

interface EvidenceChainProps {
  evidence: Evidence
  collapsible?: boolean
}

export function EvidenceChain({ evidence }: EvidenceChainProps) {
  return (
    <div style={{
      padding: 20,
      background: '#fafafa',
      borderRadius: 8,
      border: '1px solid #e8e8e8'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Phenomenon */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>现象</div>
          <div style={{ fontSize: 14, color: '#1a1a1a', fontWeight: 500 }}>
            {evidence.phenomenon}
          </div>
        </div>

        <ArrowRightOutlined style={{ color: '#999' }} />

        {/* Indicator */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>异常指标</div>
          <div style={{ fontSize: 14, color: '#fa8c16', fontWeight: 500 }}>
            {evidence.indicator}
          </div>
        </div>

        <ArrowRightOutlined style={{ color: '#999' }} />

        {/* Inference */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>推断原因</div>
          <div style={{ fontSize: 14, color: '#ff4d4f', fontWeight: 500 }}>
            {evidence.inference}
          </div>
        </div>
      </div>
    </div>
  )
}
