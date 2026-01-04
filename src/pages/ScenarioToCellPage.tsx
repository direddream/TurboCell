import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { DEMO_CELLS } from '../demo/cells'
import type { ScenarioInput } from '../utils/battery'
import {
  chemistryLabel,
  getDefaultScenario,
  getUsableSocFraction,
} from '../utils/battery'
import { matchScenarioToCells } from '../utils/matching'
import { fmt, fmtInt } from '../utils/format'
import { Card } from '../components/common/Card'
import { Tag } from '../components/common/Tag'

function numberInputProps(v: number, set: (n: number) => void) {
  return {
    value: v,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(Number(e.target.value)),
  }
}

function buildLoadSeries(input: ScenarioInput) {
  const points: Array<[number, number]> = []
  const horizonS = 120
  for (let t = 0; t <= horizonS; t++) {
    const period = 20
    const pulseW = t % period < 4 ? input.peakPowerW : input.continuousPowerW
    points.push([t, pulseW])
  }
  return points
}

export default function ScenarioToCellPage() {
  const [input, setInput] = useState<ScenarioInput>(getDefaultScenario())

  const results = useMemo(() => matchScenarioToCells(DEMO_CELLS, input), [input])
  const usableSoc = useMemo(() => getUsableSocFraction(input), [input])
  const loadSeries = useMemo(() => buildLoadSeries(input), [input])

  const chartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 18, top: 18, bottom: 40 },
      xAxis: { type: 'value', name: 't (s)' },
      yAxis: { type: 'value', name: 'P (W)' },
      series: [
        {
          type: 'line',
          showSymbol: false,
          data: loadSeries,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.08 },
        },
      ],
    }
  }, [loadSeries])

  return (
    <div className="stack">
      <div className="pageHeader">
        <h2>Scenario-to-Cell</h2>
        <div className="muted">
          工况驱动匹配：输入约束 → 推荐电芯/串并方案（启发式 Demo）
        </div>
      </div>

      <div className="grid2">
        <Card title="输入（工况/约束）">
          <div className="form">
            <label className="field">
              <span>应用场景</span>
              <select
                value={input.application}
                onChange={(e) =>
                  setInput((s) => ({
                    ...s,
                    application: e.target.value as ScenarioInput['application'],
                  }))
                }
              >
                <option value="EV">电动汽车 EV</option>
                <option value="Storage">储能 Storage</option>
                <option value="Drone">无人机 Drone</option>
                <option value="OutdoorPower">户外电源 Outdoor</option>
                <option value="Consumer">消费电子 Consumer</option>
                <option value="PowerTool">电动工具 Tool</option>
              </select>
            </label>

            <div className="grid2tight">
              <label className="field">
                <span>目标能量 (Wh)</span>
                <input
                  type="number"
                  {...numberInputProps(input.energyWh, (n) =>
                    setInput((s) => ({ ...s, energyWh: n })),
                  )}
                />
              </label>
              <label className="field">
                <span>标称电压 (V)</span>
                <input
                  type="number"
                  {...numberInputProps(input.nominalVoltageV, (n) =>
                    setInput((s) => ({ ...s, nominalVoltageV: n })),
                  )}
                />
              </label>
            </div>

            <div className="grid2tight">
              <label className="field">
                <span>峰值功率 (W)</span>
                <input
                  type="number"
                  {...numberInputProps(input.peakPowerW, (n) =>
                    setInput((s) => ({ ...s, peakPowerW: n })),
                  )}
                />
              </label>
              <label className="field">
                <span>持续功率 (W)</span>
                <input
                  type="number"
                  {...numberInputProps(input.continuousPowerW, (n) =>
                    setInput((s) => ({ ...s, continuousPowerW: n })),
                  )}
                />
              </label>
            </div>

            <div className="grid2tight">
              <label className="field">
                <span>环境最低温 (°C)</span>
                <input
                  type="number"
                  {...numberInputProps(input.minAmbientTempC, (n) =>
                    setInput((s) => ({ ...s, minAmbientTempC: n })),
                  )}
                />
              </label>
              <label className="field">
                <span>环境最高温 (°C)</span>
                <input
                  type="number"
                  {...numberInputProps(input.maxAmbientTempC, (n) =>
                    setInput((s) => ({ ...s, maxAmbientTempC: n })),
                  )}
                />
              </label>
            </div>

            <div className="grid2tight">
              <label className="field">
                <span>寿命目标 (cycles)</span>
                <input
                  type="number"
                  {...numberInputProps(input.expectedCycles, (n) =>
                    setInput((s) => ({ ...s, expectedCycles: n })),
                  )}
                />
              </label>
              <label className="field">
                <span>散热条件</span>
                <select
                  value={input.cooling}
                  onChange={(e) =>
                    setInput((s) => ({
                      ...s,
                      cooling: e.target.value as ScenarioInput['cooling'],
                    }))
                  }
                >
                  <option value="poor">较差</option>
                  <option value="normal">一般</option>
                  <option value="good">较好</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>优先级</span>
              <select
                value={input.priority}
                onChange={(e) =>
                  setInput((s) => ({
                    ...s,
                    priority: e.target.value as ScenarioInput['priority'],
                  }))
                }
              >
                <option value="balanced">均衡</option>
                <option value="safety">安全/寿命优先</option>
                <option value="performance">性能/倍率优先</option>
                <option value="cost">成本优先</option>
              </select>
            </label>
          </div>
        </Card>

        <Card title="工况预览（Demo负载曲线）">
          <div className="muted small">
            可用SOC窗口（启发式估算）：约 {fmtInt(usableSoc * 100)}%
          </div>
          <div style={{ height: 260 }}>
            <ReactECharts option={chartOption} style={{ height: '100%' }} />
          </div>
        </Card>
      </div>

      <Card title="推荐结果（Top 10）">
        <div className="tableWrap">
          <table className="table responsive-table">
            <thead>
              <tr>
                <th>电芯</th>
                <th>化学体系</th>
                <th>串并建议</th>
                <th>关键指标</th>
                <th>瓶颈</th>
                <th>风险标签</th>
                <th style={{ textAlign: 'right' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.cell.id}>
                  <td>
                    <div className="mono">{r.cell.model}</div>
                    <div className="muted small mono">{r.cell.id}</div>
                  </td>
                  <td>{chemistryLabel(r.cell.chemistry)}</td>
                  <td className="mono">
                    {r.best.ns}S × {r.best.np}P
                    <div className="muted small">
                      V≈{fmt(r.best.packNominalV, 0)} / E≈
                      {fmt(r.best.packEnergyWh / 1000, 1)}kWh
                    </div>
                  </td>
                  <td className="mono">
                    peak≈{fmt(r.best.peakCRate, 1)}C / cont≈
                    {fmt(r.best.contCRate, 1)}C
                    <div className="muted small">
                      ΔT(cont)≈{fmt(r.best.estimatedDeltaTcontC, 1)}°C /
                      life≈{fmtInt(r.best.estimatedLifeCycles)}
                    </div>
                  </td>
                  <td>
                    <Tag
                      label={r.bottleneck}
                      tone={
                        r.bottleneck.includes('超界') ||
                          r.bottleneck.includes('风险')
                          ? 'warn'
                          : r.bottleneck.includes('不足') ||
                            r.bottleneck.includes('不达标')
                            ? 'bad'
                            : 'good'
                      }
                    />
                  </td>
                  <td>
                    <div className="muted small">
                      {r.best.warnings.length ? r.best.warnings[0] : '—'}
                    </div>
                    <div className="tags">
                      {r.best.warnings.slice(0, 3).map((w) => (
                        <Tag key={w} label={w} tone="warn" />
                      ))}
                      {r.best.warnings.length === 0 ? (
                        <Tag label="OK" tone="good" />
                      ) : null}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }} className="mono">
                    {fmt(r.score, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
