import { useRef, useState } from 'react'
import { ThreeColumnLayout } from '../../components/common/ThreeColumnLayout'
import { Button, Table, Tag, Collapse, message } from 'antd'
import { DownloadOutlined, WarningFilled, CheckCircleFilled, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { EvidenceChain } from '../../components/common/EvidenceChain'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const evidenceChains = [
  {
    id: 1,
    phenomenon: '充电电压平台抬升',
    indicator: 'dV/dQ 曲线峰值右移 15mV',
    inference: '负极活性锂损失 (LLI)',
    confidence: 0.92
  },
  {
    id: 2,
    phenomenon: '放电容量衰减加快',
    indicator: 'Q_dis 下降 12.5% (450→437.5Ah)',
    inference: '正极活性材料损失 (LAM_PE)',
    confidence: 0.88
  },
  {
    id: 3,
    phenomenon: '内阻持续增长',
    indicator: 'DCIR 增长 24.3% (0.8→0.99mΩ)',
    inference: 'SEI 膜增厚',
    confidence: 0.85
  }
]

const triageRecommendations = [
  {
    grade: 'A',
    count: 2,
    action: '继续使用',
    usage: '一线应用',
    color: '#52c41a',
    icon: <CheckCircleFilled />
  },
  {
    grade: 'B',
    count: 1,
    action: '降级使用',
    usage: '二线应用/备用',
    color: '#1890ff',
    icon: <CheckCircleFilled />
  },
  {
    grade: 'C',
    count: 1,
    action: '梯次利用',
    usage: '低功率场景',
    color: '#fa8c16',
    icon: <WarningFilled />
  },
  {
    grade: 'D',
    count: 1,
    action: '回收处理',
    usage: '拆解回收',
    color: '#ff4d4f',
    icon: <CloseCircleFilled />
  }
]

export default function I3DiagnosisTriage() {
  const [generating, setGenerating] = useState(false)
  const faultChartRef = useRef<ReactECharts>(null)
  const treeChartRef = useRef<ReactECharts>(null)

  // 预加载图片
  const preloadImages = async (container: HTMLElement): Promise<void> => {
    const images = container.querySelectorAll('img')
    const promises = Array.from(images).map((img) => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve()
        } else {
          img.onload = () => resolve()
          img.onerror = () => resolve() // 即使加载失败也继续
        }
      })
    })
    await Promise.all(promises)
  }

  // 生成 PDF 报告
  const generateReport = async () => {
    setGenerating(true)
    message.loading({ content: '正在生成报告...', key: 'report', duration: 0 })

    try {
      // 创建隐藏的报告容器
      const reportContainer = document.createElement('div')
      reportContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      `
      document.body.appendChild(reportContainer)

      // 获取图表图片
      let faultChartImg = ''
      let treeChartImg = ''
      if (faultChartRef.current) {
        faultChartImg = faultChartRef.current.getEchartsInstance().getDataURL({ type: 'png', pixelRatio: 2 })
      }
      if (treeChartRef.current) {
        treeChartImg = treeChartRef.current.getEchartsInstance().getDataURL({ type: 'png', pixelRatio: 2 })
      }

      // 报告内容 HTML
      reportContainer.innerHTML = `
        <div style="background: #fff; color: #333;">
          <div style="text-align: center; margin-bottom: 60px; padding-top: 80px;">
            <h1 style="font-size: 28px; color: #1890ff; margin-bottom: 16px;">电芯诊断与分拣报告</h1>
            <p style="font-size: 14px; color: #666;">Turbo-Inspect 智能诊断系统</p>
            <div style="margin-top: 40px; font-size: 13px; color: #333; line-height: 2;">
              <p><strong>报告日期:</strong> ${new Date().toLocaleDateString('zh-CN')}</p>
              <p><strong>电芯编号:</strong> A002</p>
              <p><strong>健康等级:</strong> B 级 (降级使用)</p>
              <p><strong>报告编号:</strong> TI-${Date.now()}</p>
            </div>
          </div>

          <div style="padding-top: 30px; border-top: 2px solid #e8e8e8; page-break-inside: avoid;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">一、电芯基本信息</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; width: 25%; background: #fafafa; color: #333; font-weight: 500;">电芯编号</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">A002</td><td style="padding: 10px; border: 1px solid #d9d9d9; width: 25%; background: #fafafa; color: #333; font-weight: 500;">生产批次</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">CATL-2023-Q3-0892</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">电芯类型</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">LFP 磷酸铁锂</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">标称容量</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">280 Ah</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">标称电压</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">3.2 V</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">能量密度</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">160 Wh/kg</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">当前 SOH</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #fa8c16; font-weight: 600;">87.5%</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">健康等级</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #1890ff; font-weight: 600;">B 级</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">累计循环</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">450 次</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">预测 RUL</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">620 cycles</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">当前内阻</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">0.99 mΩ (+24.3%)</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">自放电率</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">2.8%/月</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">投运日期</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">2023-09-15</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">运行天数</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">470 天</td></tr>
            </table>

            <h3 style="font-size: 14px; color: #ff4d4f; margin: 20px 0 12px;">异常指标汇总</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <span style="background: #fff1f0; border: 1px solid #ffa39e; color: #cf1322; padding: 6px 12px; border-radius: 4px; font-size: 12px;">内阻增长 +24.3%</span>
              <span style="background: #fff7e6; border: 1px solid #ffd591; color: #d46b08; padding: 6px 12px; border-radius: 4px; font-size: 12px;">容量衰减 -12.5%</span>
              <span style="background: #fff7e6; border: 1px solid #ffd591; color: #d46b08; padding: 6px 12px; border-radius: 4px; font-size: 12px;">dV/dQ 峰值漂移 15mV</span>
            </div>
          </div>

          <div style="padding-top: 30px; margin-top: 30px; border-top: 2px solid #e8e8e8;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">二、无损测试结果</h2>
            <h3 style="font-size: 14px; color: #fa8c16; margin: 20px 0 12px;">2.1 原位阻抗测试 (EIS/DRT)</h3>
            <div style="background: #fafafa; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
              <img src="/images/inspect/insitu-EIS.png" style="max-width: 100%; max-height: 160px; display: block; margin: 0 auto;" crossorigin="anonymous" />
            </div>
            <p style="color: #333; font-size: 12px; line-height: 1.6; margin: 8px 0;"><strong>分析结论:</strong> HO 组电荷转移阻抗及界面电化学过程复杂性均高于 NN 组，界面稳定性较差。</p>
          </div>

          <div style="padding-top: 20px;">
            <h3 style="font-size: 14px; color: #fa8c16; margin: 0 0 12px;">2.2 原位X射线衍射 (XRD)</h3>
            <div style="background: #fafafa; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
              <img src="/images/inspect/insitu-XRD.png" style="max-width: 100%; max-height: 160px; display: block; margin: 0 auto;" crossorigin="anonymous" />
            </div>
            <p style="color: #333; font-size: 12px; line-height: 1.6; margin: 8px 0;"><strong>分析结论:</strong> LFP/FP 两相转变正常，峰位无明显偏移，电池维持核心结构稳定性。</p>
          </div>

          <div style="padding-top: 20px;">
            <h3 style="font-size: 14px; color: #fa8c16; margin: 0 0 12px;">2.3 原位膨胀及产气监测</h3>
            <div style="background: #fafafa; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
              <img src="/images/inspect/insitu-gas.png" style="max-width: 100%; max-height: 160px; display: block; margin: 0 auto;" crossorigin="anonymous" />
            </div>
            <p style="color: #333; font-size: 12px; line-height: 1.6; margin: 8px 0;"><strong>综合状态:</strong> 100SOC 下膨胀显著，产气成分为 CO₂/CO，<span style="color: #ff4d4f;">高 SOC 工况下结构稳定性偏弱。</span></p>
          </div>

          <div style="padding-top: 30px; margin-top: 30px; border-top: 2px solid #e8e8e8; page-break-inside: avoid;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">三、动态证据链</h2>

            <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
              <div style="font-weight: 600; color: #333; margin-bottom: 10px;">证据链 1 <span style="color: #52c41a; font-size: 12px;">(置信度: 92%)</span></div>
              <table style="width: 100%; font-size: 12px; color: #333;">
                <tr>
                  <td style="padding: 8px; background: #e6f7ff; border-radius: 4px; text-align: center; width: 28%;">现象: 充电电压平台抬升</td>
                  <td style="padding: 8px; text-align: center; width: 8%;">→</td>
                  <td style="padding: 8px; background: #fff7e6; border-radius: 4px; text-align: center; width: 28%;">指标: dV/dQ 峰值右移 15mV</td>
                  <td style="padding: 8px; text-align: center; width: 8%;">→</td>
                  <td style="padding: 8px; background: #fff1f0; border-radius: 4px; text-align: center; color: #cf1322; width: 28%;">推断: 负极活性锂损失 (LLI)</td>
                </tr>
              </table>
            </div>

            <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
              <div style="font-weight: 600; color: #333; margin-bottom: 10px;">证据链 2 <span style="color: #52c41a; font-size: 12px;">(置信度: 88%)</span></div>
              <table style="width: 100%; font-size: 12px; color: #333;">
                <tr>
                  <td style="padding: 8px; background: #e6f7ff; border-radius: 4px; text-align: center; width: 28%;">现象: 放电容量衰减加快</td>
                  <td style="padding: 8px; text-align: center; width: 8%;">→</td>
                  <td style="padding: 8px; background: #fff7e6; border-radius: 4px; text-align: center; width: 28%;">指标: Q_dis 下降 12.5%</td>
                  <td style="padding: 8px; text-align: center; width: 8%;">→</td>
                  <td style="padding: 8px; background: #fff1f0; border-radius: 4px; text-align: center; color: #cf1322; width: 28%;">推断: 正极活性材料损失 (LAM_PE)</td>
                </tr>
              </table>
            </div>

            <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
              <div style="font-weight: 600; color: #333; margin-bottom: 10px;">证据链 3 <span style="color: #52c41a; font-size: 12px;">(置信度: 85%)</span></div>
              <table style="width: 100%; font-size: 12px; color: #333;">
                <tr>
                  <td style="padding: 8px; background: #e6f7ff; border-radius: 4px; text-align: center; width: 28%;">现象: 内阻持续增长</td>
                  <td style="padding: 8px; text-align: center; width: 8%;">→</td>
                  <td style="padding: 8px; background: #fff7e6; border-radius: 4px; text-align: center; width: 28%;">指标: DCIR 增长 24.3%</td>
                  <td style="padding: 8px; text-align: center; width: 8%;">→</td>
                  <td style="padding: 8px; background: #fff1f0; border-radius: 4px; text-align: center; color: #cf1322; width: 28%;">推断: SEI 膜增厚</td>
                </tr>
              </table>
            </div>
          </div>

          <div style="padding-top: 30px; margin-top: 30px; border-top: 2px solid #e8e8e8; page-break-inside: avoid;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">四、衰减机理分析</h2>

            <h3 style="font-size: 14px; color: #333; margin: 20px 0 12px;">衰减机理贡献度</h3>
            ${faultChartImg ? `<div style="text-align: center; margin: 16px 0;"><img src="${faultChartImg}" style="max-width: 450px; max-height: 180px;" /></div>` : ''}

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
              <tr style="background: #fafafa;"><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: left; color: #333;">衰减机理</th><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">贡献度</th><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: left; color: #333;">主要诱因</th><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: left; color: #333;">关联事件</th></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 500;">LLI (锂损失)</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">45%</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">高温高SOC驻留</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">28次高温驻留, 65天高SOC存储</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d46b08; font-weight: 500;">LAM_PE (正极损失)</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">32%</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">深度循环、结构应力</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">120次深度循环, 85次高倍率充电</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d4b106; font-weight: 500;">LAM_NE (负极损失)</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">15%</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">低温充电</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">18次低温充电事件 (T<5°C)</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #1890ff; font-weight: 500;">SEI 增厚</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">8%</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">持续副反应、温度波动</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">日均温差 >15°C</td></tr>
            </table>

            <h3 style="font-size: 14px; color: #333; margin: 20px 0 12px;">根因树分析</h3>
            ${treeChartImg ? `<div style="text-align: center; margin: 16px 0;"><img src="${treeChartImg}" style="max-width: 100%;" /></div>` : ''}
          </div>

          <div style="padding-top: 30px; margin-top: 30px; border-top: 2px solid #e8e8e8;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">五、有损拆解表征 (多尺度静态证据)</h2>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #fafafa;"><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: left; color: #333; width: 20%;">表征方法</th><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: left; color: #333;">关键发现</th><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: left; color: #333; width: 25%;">风险评估</th></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 500;">SEM 形貌分析</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">正极颗粒边缘裂纹(0.5-1.2μm)，负极SEI膜厚度不均(差异200nm)，极耳区域形貌退化严重</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322;">存在局部热点</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 500;">XPS 深度剖析</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">SEI成分: Li₂CO₃(42%), LiF(28%), ROCO₂Li(18%), Li₂O(12%)，总厚度约85nm，外层富集Li₂CO₃</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d46b08;">持续副反应</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 500;">ToF-SIMS 分布</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">Li₂CO₃斑块状分布(覆盖率65%)，极耳区域副产物浓度高3.2倍，厚度标准差±25nm</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322;">局部失稳热点</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 500;">AFM 力学性质</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">粗糙度Ra: 12nm→38nm(+217%)，杨氏模量: 15GPa→8.5GPa(-43%)，膜层疏松存在孔隙</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d46b08;">力学性能退化</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 500;">TEM/FFT 结构</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">正极局部非晶化(5-8nm)，衍射斑点强度减弱35%，SEI/电极界面存在2-3nm过渡层</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d46b08;">结晶度下降</td></tr>
            </table>
          </div>

          <div style="padding-top: 30px; margin-top: 30px; border-top: 2px solid #e8e8e8; page-break-inside: avoid;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">六、分拣结果与处置建议</h2>

            <h3 style="font-size: 14px; color: #333; margin: 20px 0 12px;">批次分拣统计</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr style="background: #fafafa;"><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">等级</th><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">数量</th><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">SOH范围</th><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">处置方案</th><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">推荐用途</th></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #52c41a; font-weight: 600; text-align: center;">A 级</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">2</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">≥90%</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">继续使用</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">一线应用、原装替换</td></tr>
              <tr style="background: #e6f7ff;"><td style="padding: 12px; border: 1px solid #d9d9d9; color: #1890ff; font-weight: 600; text-align: center;">B 级</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">1</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">80-90%</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">降级使用</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">二线应用、备用电源</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #fa8c16; font-weight: 600; text-align: center;">C 级</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">1</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">70-80%</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">梯次利用</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">低功率储能、基站备电</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #ff4d4f; font-weight: 600; text-align: center;">D 级</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">1</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;"><70%</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">回收处理</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">拆解回收、材料再生</td></tr>
            </table>

            <div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #1890ff; margin: 0 0 16px; font-size: 15px;">当前电芯 (A002) 处置建议</h4>
              <table style="width: 100%; font-size: 13px; color: #333;">
                <tr><td style="padding: 8px 0; width: 25%;"><strong>分拣等级:</strong></td><td style="padding: 8px 0; color: #1890ff; font-weight: 600;">B 级 (降级使用)</td></tr>
                <tr><td style="padding: 8px 0;"><strong>残值评估:</strong></td><td style="padding: 8px 0;">60-70% 原价 (约 ¥1,200-1,400)</td></tr>
                <tr><td style="padding: 8px 0;"><strong>推荐用途:</strong></td><td style="padding: 8px 0;">备用电源、低倍率储能、梯次利用</td></tr>
                <tr><td style="padding: 8px 0;"><strong>使用限制:</strong></td><td style="padding: 8px 0;">避免快充(≤0.5C)、控温 20-30°C、避免深度放电(DOD≤80%)</td></tr>
                <tr><td style="padding: 8px 0;"><strong>监控要求:</strong></td><td style="padding: 8px 0;">每 100 次循环复检，重点监测内阻和膨胀</td></tr>
              </table>
            </div>
          </div>

          <div style="padding-top: 30px; margin-top: 30px; border-top: 2px solid #e8e8e8; page-break-inside: avoid;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">七、风险评估与定责线索</h2>

            <h3 style="font-size: 14px; color: #333; margin: 20px 0 12px;">风险评估矩阵</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr style="background: #fafafa;"><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333; width: 25%;">风险类型</th><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">风险描述</th><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333; width: 15%;">等级</th></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333; font-weight: 500;">局部热点风险</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">极耳区域退化严重，存在不均一性，局部温度可能偏高</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 600; text-align: center;">高</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333; font-weight: 500;">界面失稳风险</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">SEI膜力学性能下降43%，存在膜层脱落风险</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d46b08; font-weight: 600; text-align: center;">中</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333; font-weight: 500;">结构衰退风险</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">正极非晶化5-8nm，结晶度下降35%，长期可靠性存疑</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d46b08; font-weight: 600; text-align: center;">中</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333; font-weight: 500;">整体安全性</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">未发现不可逆结构损伤，降级使用条件下安全可控</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #52c41a; font-weight: 600; text-align: center;">可控</td></tr>
            </table>

            <h3 style="font-size: 14px; color: #333; margin: 20px 0 12px;">定责线索汇总</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #fafafa;"><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333; width: 20%;">责任类型</th><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">具体事件</th><th style="padding: 12px; border: 1px solid #d9d9d9; color: #333; width: 15%;">责任占比</th></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 500;">工况滥用</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">高温驻留(>40°C)28次，高SOC(>90%)存储65天，累计影响显著</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #cf1322; font-weight: 600; text-align: center;">50%</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d46b08; font-weight: 500;">使用习惯</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">深度循环(DOD>90%)120次，高倍率充电(>1C)85次</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d46b08; font-weight: 600; text-align: center;">30%</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d4b106; font-weight: 500;">环境因素</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">低温充电(<5°C)18次，日均温差>15°C</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #d4b106; font-weight: 600; text-align: center;">15%</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #52c41a; font-weight: 500;">制造/批次</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333;">未发现明显批次缺陷，同批次其他电芯表现正常</td><td style="padding: 12px; border: 1px solid #d9d9d9; color: #52c41a; font-weight: 600; text-align: center;">5%</td></tr>
            </table>
          </div>

          <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e8e8e8; text-align: center; color: #999; font-size: 11px;">
            <p style="margin: 4px 0;">本报告由 Turbo-Inspect 智能诊断系统自动生成</p>
            <p style="margin: 4px 0;">报告仅供参考，具体处置决策请结合实际情况</p>
            <p style="margin: 4px 0;">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
          </div>
        </div>
      `

      // 等待图片加载
      await preloadImages(reportContainer)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 分段渲染 PDF - 避免图片被切割
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 10
      const contentWidth = pageWidth - margin * 2
      let currentY = margin

      // 获取所有章节
      const sections = reportContainer.querySelectorAll(':scope > div > div')

      // 保存所有章节的 canvas 用于生成缩略图
      const sectionCanvases: HTMLCanvasElement[] = []

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement

        // 渲染单个章节
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 700
        })

        // 保存 canvas 用于缩略图
        sectionCanvases.push(canvas)

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = contentWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        const maxSectionHeight = pageHeight - margin * 2

        // 如果章节太高，需要分页处理
        if (imgHeight > maxSectionHeight) {
          // 章节太高，需要分多页
          if (currentY > margin) {
            pdf.addPage()
            currentY = margin
          }

          let remainingHeight = imgHeight
          let sourceY = 0

          while (remainingHeight > 0) {
            const drawHeight = Math.min(remainingHeight, maxSectionHeight)
            const sourceHeight = (drawHeight / imgHeight) * canvas.height

            // 创建裁剪后的 canvas
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = canvas.width
            tempCanvas.height = sourceHeight
            const ctx = tempCanvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)
              const partData = tempCanvas.toDataURL('image/png')
              pdf.addImage(partData, 'PNG', margin, margin, imgWidth, drawHeight)
            }

            remainingHeight -= drawHeight
            sourceY += sourceHeight

            if (remainingHeight > 0) {
              pdf.addPage()
            }
          }
          currentY = pageHeight
        } else {
          // 检查是否需要新页
          if (currentY + imgHeight > pageHeight - margin && i > 0) {
            pdf.addPage()
            currentY = margin
          }

          // 添加章节图片
          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
          currentY += imgHeight + 3
        }
      }

      // 生成缩略图预览 (将所有章节合并为一张图)
      console.log('开始生成缩略图, 章节数量:', sectionCanvases.length)
      if (sectionCanvases.length > 0) {
        const cols = 3 // 每行3个
        const thumbWidth = 280 // 每个缩略图宽度
        const gap = 10

        // 计算每个缩略图高度
        const thumbHeights: number[] = sectionCanvases.map((c, idx) => {
          console.log(`Canvas ${idx}: width=${c.width}, height=${c.height}`)
          if (c.width > 0) {
            return Math.round((c.height / c.width) * thumbWidth)
          }
          return 200 // 默认高度
        })

        const rows = Math.ceil(sectionCanvases.length / cols)

        // 计算每行的最大高度
        const rowMaxHeights: number[] = []
        for (let r = 0; r < rows; r++) {
          const startIdx = r * cols
          const endIdx = Math.min(startIdx + cols, thumbHeights.length)
          const rowHeights = thumbHeights.slice(startIdx, endIdx)
          rowMaxHeights.push(Math.max(...rowHeights, 100))
        }

        // 计算总高度
        const totalHeight = rowMaxHeights.reduce((sum, h) => sum + h, 0) + gap * (rows + 1)
        console.log('缩略图尺寸:', thumbWidth * cols + gap * (cols + 1), 'x', totalHeight)

        // 创建缩略图画布
        const thumbnailCanvas = document.createElement('canvas')
        thumbnailCanvas.width = thumbWidth * cols + gap * (cols + 1)
        thumbnailCanvas.height = totalHeight
        const thumbCtx = thumbnailCanvas.getContext('2d')

        if (thumbCtx) {
          thumbCtx.fillStyle = '#f5f5f5'
          thumbCtx.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height)

          // 绘制每个章节缩略图
          let currentY = gap
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const i = r * cols + c
              if (i >= sectionCanvases.length) break

              const canvas = sectionCanvases[i]
              const x = gap + c * (thumbWidth + gap)
              const h = thumbHeights[i]

              // 绘制白色背景和边框
              thumbCtx.fillStyle = '#ffffff'
              thumbCtx.fillRect(x, currentY, thumbWidth, h)
              thumbCtx.strokeStyle = '#e0e0e0'
              thumbCtx.lineWidth = 1
              thumbCtx.strokeRect(x, currentY, thumbWidth, h)

              // 绘制缩略图内容
              if (canvas.width > 0 && canvas.height > 0) {
                thumbCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, x, currentY, thumbWidth, h)
              }
            }
            currentY += rowMaxHeights[r] + gap
          }

          // 下载缩略图
          const thumbLink = document.createElement('a')
          thumbLink.download = `电芯诊断报告_A002_缩略图_${new Date().toISOString().slice(0, 10)}.png`
          thumbLink.href = thumbnailCanvas.toDataURL('image/png')
          thumbLink.click()
          console.log('缩略图已生成')
        }
      } else {
        console.warn('没有章节canvas可用于生成缩略图')
      }

      // 清理
      document.body.removeChild(reportContainer)

      // 保存 PDF
      pdf.save(`电芯诊断报告_A002_${new Date().toISOString().slice(0, 10)}.pdf`)
      message.success({ content: '报告生成成功！', key: 'report' })
    } catch (error) {
      console.error('生成报告失败:', error)
      message.error({ content: '报告生成失败，请重试', key: 'report' })
    } finally {
      setGenerating(false)
    }
  }
  // 故障模式贡献度
  const faultModeOption = {
    title: {
      text: '衰减机理贡献度',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)',
      backgroundColor: 'rgba(20,30,50,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: 'rgba(255,255,255,0.65)' }
    },
    series: [
      {
        name: '衰减机理',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'rgba(15,25,40,1)',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}%',
          color: 'rgba(255,255,255,0.85)'
        },
        data: [
          { value: 45, name: 'LLI (锂损失)', itemStyle: { color: '#ff4d4f' } },
          { value: 32, name: 'LAM_PE (正极)', itemStyle: { color: '#fa8c16' } },
          { value: 15, name: 'LAM_NE (负极)', itemStyle: { color: '#fadb14' } },
          { value: 8, name: 'SEI 增厚', itemStyle: { color: '#1890ff' } }
        ]
      }
    ]
  }

  // 根因树
  const rootCauseTreeOption = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(20,30,50,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        type: 'tree',
        data: [
          {
            name: '容量衰减',
            children: [
              {
                name: 'LLI (45%)',
                children: [
                  { name: '高温驻留 (28次)' },
                  { name: '高SOC存储 (65天)' }
                ]
              },
              {
                name: 'LAM_PE (32%)',
                children: [
                  { name: '深度循环 (120次)' },
                  { name: '高倍率充电 (85次)' }
                ]
              },
              {
                name: 'LAM_NE (15%)',
                children: [
                  { name: '低温充电 (18次)' }
                ]
              },
              {
                name: 'SEI 增厚 (8%)',
                children: [
                  { name: '温度波动大' }
                ]
              }
            ]
          }
        ],
        top: '5%',
        left: '10%',
        bottom: '5%',
        right: '20%',
        symbolSize: 7,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 11,
          color: 'rgba(255,255,255,0.85)'
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
            color: 'rgba(255,255,255,0.65)'
          }
        },
        lineStyle: {
          color: 'rgba(255,255,255,0.3)'
        },
        emphasis: {
          focus: 'descendant'
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750
      }
    ]
  }

  const leftPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>诊断对象</h3>

      <div style={{
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 6,
        marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'rgba(255,255,255,0.92)' }}>A002</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
          <div>• 健康等级: B 级</div>
          <div>• SOH: 87.5%</div>
          <div>• 当前循环: 450</div>
          <div>• RUL: 620 cycles</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>异常指标</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Tag color="red">内阻增长 +24.3%</Tag>
          <Tag color="orange">容量衰减 -12.5%</Tag>
          <Tag color="orange">dV/dQ 峰值漂移</Tag>
        </div>
      </div>

      <div style={{
        padding: 16,
        background: 'rgba(250,173,20,0.1)',
        borderRadius: 6,
        fontSize: 13,
        color: 'rgba(255,255,255,0.65)',
        marginBottom: 24,
        border: '1px solid rgba(250,173,20,0.3)'
      }}>
        <div style={{ fontWeight: 500, marginBottom: 8, color: '#faad14' }}>🔬 无损测试方法</div>
        <div>• 原位阻抗测试 (EIS/DRT)</div>
        <div>• IC/DV 曲线分析</div>
        <div>• 原位X射线衍射 (XRD)</div>
        <div>• 原位膨胀及产气监测</div>
      </div>

      <div style={{
        padding: 16,
        background: 'rgba(255,77,79,0.1)',
        borderRadius: 6,
        fontSize: 13,
        color: 'rgba(255,255,255,0.65)',
        border: '1px solid rgba(255,77,79,0.3)'
      }}>
        <div style={{ fontWeight: 500, marginBottom: 8, color: '#ff4d4f' }}>🔪 有损拆解表征</div>
        <div>• SEM 形貌与区域分析</div>
        <div>• XPS 界面膜成分剖析</div>
        <div>• ToF-SIMS 2D/3D 分布</div>
        <div>• AFM 膜粗糙度分析</div>
        <div>• TEM/FFT 结构验证</div>
      </div>
    </div>
  )

  const centerPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>故障诊断</h3>

      {/* 无损测试结果 */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: '#fa8c16' }}>
          📊 无损测试结果
        </h4>
        <Collapse
          size="small"
          defaultActiveKey={['1']}
          items={[
            {
              key: '1',
              label: '原位阻抗测试 (EIS/DRT)',
              children: (
                <div>
                  <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                    <img src="/images/inspect/insitu-EIS.png" alt="In-situ EIS" style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div style={{ marginBottom: 4 }}><strong>Nyquist/DRT 分析：</strong>HO 组弛豫峰强度（y (τ)）显著高于 NN (标准)组，对应电荷转移阻抗更大；且 HO 组充放电过程中弛豫峰分布更分散，界面电化学行为更复杂。</div>
                    <div style={{ color: '#ff4d4f' }}><strong>结论：</strong>HO 组电荷转移阻抗及界面电化学过程复杂性均高于 NN 组，其界面稳定性更差，充放电内阻损耗更显著。</div>
                  </div>
                </div>
              )
            },
            {
              key: '2',
              label: '原位X射线衍射 (XRD)',
              children: (
                <div>
                  <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                    <img src="/images/inspect/insitu-XRD.png" alt="XRD相含量变化" style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>图3: 原位XRD 两相含量变化</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div><strong>相含量变化:</strong> 1C→MC 阶段 LFP/FP 两相转变峰强度升高，物相信号更显著</div>
                    <div><strong>晶格参数:</strong> 峰位无明显偏移，a/c 轴无剧烈畸变，仅 MC 阶段结构应力略增</div>
                    <div><strong>结论:</strong> 电池仍维持核心结构稳定性，多循环后活性信号增强但应力小幅累积</div>
                  </div>
                </div>
              )
            },
            {
              key: '3',
              label: '原位膨胀及产气监测',
              children: (
                <div>
                  <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                    <img src="/images/inspect/insitu-gas.png" alt="原位膨胀及产气监测" style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>原位膨胀及产气监测 (Volume Change + Gas Concentration)</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div style={{ marginBottom: 4 }}><strong>膨胀特性：</strong>100SOC 下体积膨胀更显著，相比 50SOC 峰值更高且循环后不可逆膨胀累积明显，说明其在高 SOC 循环时，负极 SEI 膜、正极结构的稳定性不足，长期循环易出现结构松弛；</div>
                    <div style={{ marginBottom: 4 }}><strong>产气分析：</strong>主要产气成分为 CO₂ 和 CO，高 SOC 下产气量显著增加，反映其界面副反应（电解液分解）较活跃；</div>
                    <div style={{ color: '#ff4d4f' }}><strong>综合状态：</strong>该电池在常规 SOC（50%）下的膨胀、产气表现尚可，但高 SOC 工况下的结构稳定性、界面稳定性偏弱，若长期在高 SOC 区间循环，容量衰减速率、安全风险会高于同类型优质 LFP 电池。</div>
                  </div>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Evidence Chains */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>动态证据链</h4>
        {evidenceChains.map((chain) => (
          <div key={chain.id} style={{ marginBottom: 12 }}>
            <EvidenceChain
              evidence={{
                phenomenon: chain.phenomenon,
                indicator: chain.indicator,
                inference: chain.inference
              }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#666', marginTop: 4 }}>
              置信度: {(chain.confidence * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      {/* Fault Mode Contribution */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>衰减机理分析</h4>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <ReactECharts ref={faultChartRef} option={faultModeOption} style={{ height: 300 }} />
        </div>
      </div>

      {/* Root Cause Tree */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>根因树</h4>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <ReactECharts ref={treeChartRef} option={rootCauseTreeOption} style={{ height: 320 }} />
        </div>
      </div>

      {/* 有损拆解表征 */}
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: '#ff4d4f' }}>
          🔬 有损拆解表征 (多尺度静态证据)
        </h4>
        <Collapse
          size="small"
          items={[
            {
              key: '1',
              label: 'SEM 形貌与区域差异分析',
              children: (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                      <img src="/images/inspect/SEM-LFP.png" alt="SEM-LFP正极" style={{ width: '100%', maxHeight: 180, objectFit: 'contain' }} />
                      <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>LFP正极 (50SOC vs 100SOC)</div>
                    </div>
                    <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                      <img src="/images/inspect/SEM-graphite.png" alt="SEM-石墨负极" style={{ width: '100%', maxHeight: 180, objectFit: 'contain' }} />
                      <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>石墨负极 (50SOC vs 100SOC)</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div><strong>正极 (LFP):</strong> 50SOC下颗粒形貌完整，100SOC下表面出现副产物沉积</div>
                    <div><strong>负极 (石墨):</strong> 高SOC下SEI膜增厚明显，100SOC石墨表面颗粒状沉积物增多</div>
                    <div><strong>区域差异:</strong> 极耳附近SEI膜厚度不均，厚度差异达200nm</div>
                    <div><strong>风险评估:</strong> 高SOC下界面稳定性下降，建议降级使用</div>
                  </div>
                </div>
              )
            },
            {
              key: '2',
              label: 'XPS 界面膜成分深度剖析',
              children: (
                <div>
                  <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                    <img src="/images/inspect/XPS.png" alt="XPS深度剖析" style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>C 1s / O 1s / F 1s 光电子能谱 (不同温度/内外层)</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div><strong>C 1s:</strong> CO₃²⁻、C-C/C-H、C-O、C=O、Li₂C 组分识别，外层碳酸盐富集</div>
                    <div><strong>O 1s:</strong> C-O、CO₃²⁻ 信号，45°C下外层氧化物增多</div>
                    <div><strong>F 1s:</strong> P-F、Li-F 双峰，内层LiF为主导成分</div>
                    <div><strong>温度影响:</strong> 45°C高温循环后SEI膜成分变化明显，稳定性下降</div>
                  </div>
                </div>
              )
            },
            {
              key: '3',
              label: 'ToF-SIMS 2D/3D 分子级分布',
              children: (
                <div>
                  <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                    <img src="/images/inspect/ToF-SIMS.png" alt="ToF-SIMS 2D分布" style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>ToF-SIMS 负离子 2D 空间分布 (C₂⁻, CH₂⁻, C₂O⁻, LiO⁻)</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div><strong>C₂⁻/CH₂⁻:</strong> 有机组分分布均匀，表明有机SEI层覆盖完整</div>
                    <div><strong>C₂O⁻:</strong> 碳酸盐类组分局部富集，与XPS结果一致</div>
                    <div><strong>LiO⁻:</strong> 锂氧化物分布不均，存在局部热点区域</div>
                    <div><strong>深度剖析:</strong> 界面副产物厚度标准差±25nm，需关注均匀性</div>
                  </div>
                </div>
              )
            },
            {
              key: '4',
              label: 'AFM 膜粗糙度与力学性质',
              children: (
                <div>
                  <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                    <img src="/images/inspect/AFM.png" alt="AFM表面形貌与力学性质" style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>AFM 表面形貌 (Height) 与 DMT 模量分布</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div><strong>粗糙度Ra:</strong> 新鲜电极12nm，老化后增至38nm，增长217%</div>
                    <div><strong>力学模量:</strong> SEI膜杨氏模量从15GPa降至8.5GPa</div>
                    <div><strong>膜致密性:</strong> 力曲线显示膜层疏松，存在孔隙结构</div>
                    <div><strong>力学风险:</strong> 膜层力学性能退化，存在脱落风险</div>
                  </div>
                </div>
              )
            },
            {
              key: '5',
              label: 'TEM/FFT 局部结构补强验证',
              children: (
                <div>
                  <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                    <img src="/images/inspect/TEM.png" alt="TEM晶格结构分析" style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>TEM 高分辨晶格像: PLFP-C vs LFP-JDSR-C</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div><strong>晶格结构:</strong> 正极局部非晶化，非晶层厚度5-8nm</div>
                    <div><strong>FFT分析:</strong> 衍射斑点强度减弱35%，表明结晶度下降</div>
                    <div><strong>界面层:</strong> SEI/电极界面存在2-3nm过渡层</div>
                    <div><strong>补强结论:</strong> 交叉验证了XRD和XPS的结构退化结论</div>
                  </div>
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  )

  const rightPanel = (
    <div>
      <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>分拣建议</h3>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>批次分拣结果</h4>
        <Table
          dataSource={triageRecommendations}
          pagination={false}
          size="small"
          rowKey="grade"
          columns={[
            {
              title: '等级',
              dataIndex: 'grade',
              key: 'grade',
              width: 60,
              render: (grade, record) => (
                <Tag color={record.color} icon={record.icon}>
                  {grade}
                </Tag>
              )
            },
            {
              title: '数量',
              dataIndex: 'count',
              key: 'count',
              width: 60,
              render: (count) => <span style={{ fontSize: 13, fontWeight: 500 }}>{count}</span>
            },
            {
              title: '处置方案',
              dataIndex: 'action',
              key: 'action',
              render: (action, record) => (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{action}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{record.usage}</div>
                </div>
              )
            }
          ]}
        />
      </div>

      <div style={{
        padding: 20,
        background: 'rgba(24,144,255,0.1)',
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid rgba(24,144,255,0.3)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: '#1890ff' }}>
          当前电芯 (A002) 建议
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
          <div>• 分级: B 级 (降级使用)</div>
          <div>• 适用场景: 备用电源、低倍率应用</div>
          <div>• 限制条件: 避免快充、控温 20-30°C</div>
          <div>• 复检周期: 每 100 次循环</div>
        </div>
      </div>

      <Collapse
        ghost
        style={{ marginBottom: 24 }}
        items={[
          {
            key: '1',
            label: '📋 详细诊断报告 (现象-证据-机理-风险-处置)',
            children: (
              <div style={{ fontSize: 13, color: '#666', lineHeight: 2 }}>
                <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>一、现象识别</div>
                <div>• 容量衰减12.5% (SOH 87.5%)</div>
                <div>• 内阻增长24.3% (0.8→0.99mΩ)</div>
                <div>• dV/dQ峰值右移15mV</div>

                <div style={{ fontWeight: 600, color: '#1a1a1a', marginTop: 16, marginBottom: 8 }}>二、多模态证据链</div>
                <div><strong>无损动态证据:</strong></div>
                <div>  - EIS/DRT: 界面阻抗增长，SEI膜增厚</div>
                <div>  - 原位XRD: 晶格应力累积，结构稳定性下降</div>
                <div>  - 产气监测: 电解液持续分解，CO₂占45%</div>
                <div><strong>有损静态证据:</strong></div>
                <div>  - SEM: 正极裂纹，负极SEI不均，极耳热点</div>
                <div>  - XPS: SEI成分分层，外层Li₂CO₃，内层LiF</div>
                <div>  - ToF-SIMS: 界面副产物空间分布不均一</div>
                <div>  - AFM: 膜粗糙度增217%，力学模量降43%</div>
                <div>  - TEM: 正极非晶化5-8nm，结晶度降35%</div>

                <div style={{ fontWeight: 600, color: '#1a1a1a', marginTop: 16, marginBottom: 8 }}>三、机理解耦</div>
                <div>• LLI (锂损失) 45% - 高温高SOC驻留导致</div>
                <div>• LAM_PE (正极活性损失) 32% - 深度循环、结构应力</div>
                <div>• LAM_NE (负极活性损失) 15% - 低温充电</div>
                <div>• SEI增厚 8% - 持续副反应、温度波动</div>

                <div style={{ fontWeight: 600, color: '#1a1a1a', marginTop: 16, marginBottom: 8 }}>四、风险评估</div>
                <div>• <span style={{ color: '#ff4d4f' }}>局部热点风险:</span> 极耳区域退化严重，存在不均一性</div>
                <div>• <span style={{ color: '#fa8c16' }}>界面失稳:</span> SEI膜力学性能下降，存在脱落风险</div>
                <div>• <span style={{ color: '#fadb14' }}>结构衰退:</span> 正极非晶化，长期可靠性存疑</div>
                <div>• <span style={{ color: '#52c41a' }}>整体可控:</span> 未发现不可逆损伤，可降级使用</div>

                <div style={{ fontWeight: 600, color: '#1a1a1a', marginTop: 16, marginBottom: 8 }}>五、处置建议</div>
                <div>• <strong>分级:</strong> B级 (降级使用)</div>
                <div>• <strong>残值:</strong> 60-70% 原价</div>
                <div>• <strong>用途:</strong> 备用电源、低倍率储能、梯次利用</div>
                <div>• <strong>限制:</strong> 避免快充、控温20-30°C、避免深度放电</div>
                <div>• <strong>监控:</strong> 每100次循环复检，重点监测内阻和膨胀</div>

                <div style={{ fontWeight: 600, color: '#1a1a1a', marginTop: 16, marginBottom: 8 }}>六、定责线索</div>
                <div>• 工况滥用: 高温高SOC驻留28次 (主要责任)</div>
                <div>• 深度循环: 120次深度循环 (次要因素)</div>
                <div>• 低温充电: 18次低温充电事件</div>
                <div>• 批次/制造: 未发现明显批次缺陷</div>
              </div>
            )
          }
        ]}
      />

      <Button
        type="primary"
        size="large"
        block
        icon={generating ? <LoadingOutlined /> : <DownloadOutlined />}
        onClick={generateReport}
        disabled={generating}
        style={{ marginBottom: 12 }}
      >
        {generating ? '正在生成...' : '生成诊断与分拣报告'}
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
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>Turbo-Inspect / 故障诊断与分拣</h2>
        <div style={{ fontSize: 14, color: '#666' }}>
          步骤 3/3: 识别衰减机理,给出分拣建议
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
