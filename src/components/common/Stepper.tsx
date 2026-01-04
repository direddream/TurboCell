import { CheckCircleFilled, ClockCircleOutlined, LoadingOutlined } from '@ant-design/icons'

interface Step {
  title: string
  status: 'completed' | 'processing' | 'pending'
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep?: number
}

export function Stepper({ steps }: StepperProps) {
  return (
    <div style={{ padding: '24px 0' }}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1

        const dotBg =
          step.status === 'completed'
            ? 'var(--success)'
            : step.status === 'processing'
              ? 'var(--primary)'
              : 'rgba(255,255,255,0.10)'

        const dotFg = step.status === 'pending' ? 'var(--text-muted)' : 'var(--bg-page)'

        return (
          <div key={index} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: dotBg,
                  color: dotFg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {step.status === 'completed' && <CheckCircleFilled />}
                {step.status === 'processing' && <LoadingOutlined />}
                {step.status === 'pending' && <ClockCircleOutlined />}
              </div>

              <div style={{ flex: 1, paddingBottom: isLast ? 0 : 32 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{step.description}</div>
                )}
              </div>
            </div>

            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: 15,
                  top: 32,
                  bottom: 0,
                  width: 2,
                  background: step.status === 'completed' ? 'var(--success)' : 'rgba(255,255,255,0.12)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

