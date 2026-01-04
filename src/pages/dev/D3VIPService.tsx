import { useState, useRef } from 'react'
import { ThreeColumnLayout } from '../../components/common/ThreeColumnLayout'
import { Button, Collapse, Modal, message, Progress } from 'antd'
import { DownloadOutlined, FileTextOutlined, WarningFilled, EyeOutlined, LoadingOutlined, CameraOutlined } from '@ant-design/icons'
import { useDev } from '../../contexts/DevContext'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const { Panel } = Collapse

export default function D3VIPService() {
  const { predictionResult } = useDev()
  const [evidenceModalVisible, setEvidenceModalVisible] = useState(false)
  const [hotspotModalVisible, setHotspotModalVisible] = useState(false)
  const [currentDensityModalVisible, setCurrentDensityModalVisible] = useState(false)
  const [stressModalVisible, setStressModalVisible] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [sampleImages, setSampleImages] = useState<string[]>(['/images/inspect/图1.jpg', '/images/inspect/图2.jpg'])
  const [generating, setGenerating] = useState(false)
  const [exportingImage, setExportingImage] = useState(false)

  // 报告长图导出的 ref
  const reportSidebarRef = useRef<HTMLDivElement>(null)

  // 失效模式数据
  const failureModes = [
    { mode: 'LLI', name: '活性锂损失', probability: 65, color: '#ff6b6b', description: 'SEI膜生长持续消耗活性锂' },
    { mode: 'LAM_PE', name: '正极活性损失', probability: 25, color: '#fadb14', description: '颗粒开裂、结构相变导致' }
  ]

  // 导出报告长图（PNG）- 固定尺寸 8cm × 12.41cm (300DPI)
  const exportReportImage = async () => {
    if (!reportSidebarRef.current) return

    setExportingImage(true)
    message.loading({ content: '正在生成报告长图...', key: 'exportImage', duration: 0 })

    try {
      const element = reportSidebarRef.current

      // 目标尺寸: 8cm × 12.41cm @ 300DPI
      const targetWidthPx = Math.round(8 / 2.54 * 300)   // ≈ 945px
      const targetHeightPx = Math.round(12.41 / 2.54 * 300) // ≈ 1466px

      // 创建一个克隆容器用于截图（避免滚动问题）
      const cloneContainer = document.createElement('div')
      cloneContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: ${targetWidthPx / 2}px;
        padding: 24px;
        background: linear-gradient(180deg, #0f1b33 0%, #0b1220 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      `
      cloneContainer.innerHTML = element.innerHTML
      document.body.appendChild(cloneContainer)

      // 等待一下让样式生效
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(cloneContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f1b33',
        width: targetWidthPx / 2,
        height: cloneContainer.scrollHeight,
        windowHeight: cloneContainer.scrollHeight
      })

      // 清理克隆容器
      document.body.removeChild(cloneContainer)

      // 创建目标尺寸的 canvas
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = targetWidthPx
      finalCanvas.height = targetHeightPx
      const ctx = finalCanvas.getContext('2d')

      if (ctx) {
        // 填充背景色
        ctx.fillStyle = '#0f1b33'
        ctx.fillRect(0, 0, targetWidthPx, targetHeightPx)

        // 计算缩放比例，保持宽度适配
        const scaleRatio = targetWidthPx / canvas.width
        const scaledHeight = canvas.height * scaleRatio

        // 绘制内容（如果内容超出高度则裁剪）
        if (scaledHeight <= targetHeightPx) {
          // 内容不足，居中或顶部对齐
          ctx.drawImage(canvas, 0, 0, targetWidthPx, scaledHeight)
        } else {
          // 内容超出，按比例缩放到适合高度
          const fitRatio = Math.min(targetWidthPx / canvas.width, targetHeightPx / canvas.height)
          const fitWidth = canvas.width * fitRatio
          const fitHeight = canvas.height * fitRatio
          const offsetX = (targetWidthPx - fitWidth) / 2
          ctx.drawImage(canvas, offsetX, 0, fitWidth, fitHeight)
        }
      }

      // 转换为图片并下载
      const imgData = finalCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `VIP_Report_Sidebar_TC-2025-001_${new Date().toISOString().slice(0, 10)}.png`
      link.href = imgData
      link.click()

      message.success({ content: '报告长图导出成功！', key: 'exportImage' })
    } catch (error) {
      console.error('导出报告长图失败:', error)
      message.error({ content: '导出失败，请重试', key: 'exportImage' })
    } finally {
      setExportingImage(false)
    }
  }

  // 预加载图片
  const preloadImages = async (container: HTMLElement): Promise<void> => {
    const images = container.querySelectorAll('img')
    const promises = Array.from(images).map((img) => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve()
        } else {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }
      })
    })
    await Promise.all(promises)
  }

  // 生成 PDF 报告
  const generateReport = async () => {
    setGenerating(true)
    message.loading({ content: '正在生成工程报告...', key: 'report', duration: 0 })

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

      // 报告内容 HTML
      reportContainer.innerHTML = `
        <div style="background: #fff; color: #333;">
          <!-- 封面 -->
          <div style="text-align: center; margin-bottom: 60px; padding-top: 80px;">
            <h1 style="font-size: 28px; color: #1890ff; margin-bottom: 16px;">Turbo-Dev VIP 工程报告</h1>
            <p style="font-size: 14px; color: #666;">电芯寿命预测与优化策略</p>
            <div style="margin-top: 40px; font-size: 13px; color: #333; line-height: 2;">
              <p><strong>项目编号:</strong> TC-2025-001</p>
              <p><strong>电芯型号:</strong> NCM811-50Ah</p>
              <p><strong>样品数量:</strong> 3 pcs</p>
              <p><strong>报告日期:</strong> ${new Date().toLocaleDateString('zh-CN')}</p>
            </div>
          </div>

          <!-- 一、项目概览 -->
          <div style="padding-top: 30px; border-top: 2px solid #e8e8e8; page-break-inside: avoid;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">一、项目概览</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; width: 25%; background: #fafafa; color: #333; font-weight: 500;">项目编号</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">TC-2025-001</td><td style="padding: 10px; border: 1px solid #d9d9d9; width: 25%; background: #fafafa; color: #333; font-weight: 500;">项目来源</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">Turbo-Dev Online</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">电芯型号</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">NCM811-50Ah</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">样品数量</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">3 pcs</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">到样日期</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">2024-11-20</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">完成日期</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">${new Date().toLocaleDateString('zh-CN')}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">目标精度</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">区间收敛到 ±5%</td><td style="padding: 10px; border: 1px solid #d9d9d9; background: #fafafa; color: #333; font-weight: 500;">交付类型</td><td style="padding: 10px; border: 1px solid #d9d9d9; color: #333;">工程交付包</td></tr>
            </table>

            <h3 style="font-size: 14px; color: #52c41a; margin: 20px 0 12px;">样品接收确认</h3>
            <div className="responsive-grid" style={{ marginBottom: 16 }}>
              <div style="background: #fafafa; padding: 12px; border-radius: 6px; text-align: center;">
                <img src="/images/inspect/图1.jpg" style="max-width: 100%; max-height: 140px; border-radius: 4px;" crossorigin="anonymous" />
                <div style="font-size: 11px; color: #666; margin-top: 8px;">图1 - 样品外观</div>
              </div>
              <div style="background: #fafafa; padding: 12px; border-radius: 6px; text-align: center;">
                <img src="/images/inspect/图2.jpg" style="max-width: 100%; max-height: 140px; border-radius: 4px;" crossorigin="anonymous" />
                <div style="font-size: 11px; color: #666; margin-top: 8px;">图2 - 样品标签</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <span style="background: #f6ffed; border: 1px solid #b7eb8f; color: #52c41a; padding: 6px 12px; border-radius: 4px; font-size: 12px;">样品编号: TC-2025-001-A/B/C</span>
              <span style="background: #f6ffed; border: 1px solid #b7eb8f; color: #52c41a; padding: 6px 12px; border-radius: 4px; font-size: 12px;">重量: 152.3g / 152.1g / 152.4g</span>
              <span style="background: #f6ffed; border: 1px solid #b7eb8f; color: #52c41a; padding: 6px 12px; border-radius: 4px; font-size: 12px;">外观检查: ✓ 无异常</span>
            </div>
          </div>

          <!-- 二、短测试数据验证 -->
          <div style="padding-top: 30px; margin-top: 30px; border-top: 2px solid #e8e8e8;">
            <h2 style="font-size: 18px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 20px;">二、短测试数据验证 (10周 / 200周)</h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr style="background: #fafafa;"><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: left; color: #333;">测试指标</th><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">初始值</th><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">200周后</th><th style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">变化</th></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333; font-weight: 500;">放电容量</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">50.2 Ah</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">48.8 Ah</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #52c41a;">-2.8%</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333; font-weight: 500;">容量保持率</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">100%</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">97.2%</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #52c41a;">良好</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333; font-weight: 500;">DCIR (内阻)</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">16.8 mΩ</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">18.2 mΩ</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #fa8c16;">+8.3%</td></tr>
              <tr><td style="padding: 12px; border: 1px solid #d9d9d9; color: #333; font-weight: 500;">HPPC 10s脉冲</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">-</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">18.2 mΩ</td><td style="padding: 12px; border: 1px solid #d9d9d9; text-align: center; color: #333;">-</td></tr>
            </table>

            <h3 style="font-size: 14px; color: #333; margin: 20px 0 12px;">电化学曲线分析</h3>
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', marginBottom: 16 }}>
              <div style="background: #fafafa; padding: 12px; border-radius: 6px; text-align: center;">
                <img src="/images/echem-capacity.png" style="max-width: 100%; max-height: 120px;" crossorigin="anonymous" />
                <div style="font-size: 11px; color: #666; margin-top: 8px;">容量衰减曲线</div>
              </div>
              <div style="background: #fafafa; padding: 12px; border-radius: 6px; text-align: center;">
                <img src="/images/echem-dcir.png" style="max-width: 100%; max-height: 120px;" crossorigin="anonymous" />
                <div style="font-size: 11px; color: #666; margin-top: 8px;">内阻增长曲线</div>
              </div>
              <div style="background: #fafafa; padding: 12px; border-radius: 6px; text-align: center;">
                <img src="/images/echem-dQdV.png" style="max-width: 100%; max-height: 120px;" crossorigin="anonymous" />
                <div style="font-size: 11px; color: #666; margin-top: 8px;">dQ/dV 曲线</div>
              </div>
            </div>
            <p style="color: #333; font-size: 12px; line-height: 1.6; margin: 8px 0;"><strong>结论:</strong> 短测试表现良好，衰减速率符合预期。容量衰减曲线呈线性趋势，无异常跳变；dQ/dV峰位稳定，材料结构稳定。</p>
          </div>

          <!-- 页脚 -->
          <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e8e8e8; text-align: center; color: #999; font-size: 11px;">
            <p style="margin: 4px 0;">本报告由 Turbo-Dev VIP 智能预测系统自动生成</p>
            <p style="margin: 4px 0;">报告仅供工程参考，具体决策请结合实际情况</p>
            <p style="margin: 4px 0;">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
            <p style="margin: 4px 0;">© 2025 Turbo-Select 极速芯研</p>
          </div>
        </div>
      `

      // 等待图片加载
      await preloadImages(reportContainer)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 分段渲染 PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 10
      const contentWidth = pageWidth - margin * 2
      let currentY = margin

      // 获取所有章节
      const sections = reportContainer.querySelectorAll(':scope > div > div')

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

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = contentWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        const maxSectionHeight = pageHeight - margin * 2

        // 如果章节太高，需要分页处理
        if (imgHeight > maxSectionHeight) {
          if (currentY > margin) {
            pdf.addPage()
            currentY = margin
          }

          let remainingHeight = imgHeight
          let sourceY = 0

          while (remainingHeight > 0) {
            const drawHeight = Math.min(remainingHeight, maxSectionHeight)
            const sourceHeight = (drawHeight / imgHeight) * canvas.height

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
          if (currentY + imgHeight > pageHeight - margin && i > 0) {
            pdf.addPage()
            currentY = margin
          }

          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
          currentY += imgHeight + 3
        }
      }

      // 清理
      document.body.removeChild(reportContainer)

      // 保存 PDF
      pdf.save(`Turbo-Dev_VIP工程报告_TC-2025-001_${new Date().toISOString().slice(0, 10)}.pdf`)
      message.success({ content: '报告生成成功！', key: 'report' })
    } catch (error) {
      console.error('生成报告失败:', error)
      message.error({ content: '报告生成失败，请重试', key: 'report' })
    } finally {
      setGenerating(false)
    }
  }

  // Handle image upload
  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newImages = [...sampleImages]
        newImages[index] = reader.result as string
        setSampleImages(newImages)
        message.success(`图${index + 1} 已更新`)
      }
      reader.readAsDataURL(file)
    }
  }

  // 使用 Online 预测结果进行对比
  const onlineResult = predictionResult || {
    lifespanRange: { min: 1200, max: 1800 },
    confidence: 'medium' as const,
    intervalWidth: 40
  }

  const vipResult = {
    lifespanRange: { min: 1450, max: 1520 },
    confidence: 'high' as const,
    intervalWidth: 5
  }

  const improvement = {
    intervalNarrowing: ((onlineResult.intervalWidth - vipResult.intervalWidth) / onlineResult.intervalWidth * 100).toFixed(0),
    confidenceImprovement: onlineResult.confidence === 'medium' ? '+32%' : '+20%'
  }

  // 步骤详细信息
  const stepDetails = [
    {
      title: '提交样品',
      status: 'completed',
      description: '电芯样品已接收',
      evidence: {
        photos: ['收样照片 #1', '收样照片 #2'],
        records: [
          { label: '样品编号', value: 'TC-2025-001-A/B/C' },
          { label: '重量', value: '152.3g / 152.1g / 152.4g' },
          { label: '外观检查', value: '✓ 无异常' },
          { label: '安全检查', value: '✓ 通过' }
        ]
      }
    },
    {
      title: '短测试 (10周)',
      status: 'completed',
      description: '完成 200 次充放电循环',
      evidence: {
        data: [
          { label: '循环次数', value: '200' },
          { label: '容量保持率', value: '97.2%' },
          { label: 'DCIR增长', value: '+8.3%' },
          { label: 'HPPC 10s脉冲', value: '18.2mΩ' }
        ],
        charts: ['容量衰减曲线', '内阻增长曲线', 'dQ/dV曲线']
      }
    },
    {
      title: '多物理场仿真',
      status: 'completed',
      description: '电化学-热-力耦合仿真',
      evidence: {
        simulations: [
          { name: '温度场分布', status: '✓ 已完成', finding: '热点位于极耳连接处,最高温升12°C' },
          { name: '电流密度场', status: '✓ 已完成', finding: '分布均匀,无明显集中' },
          { name: 'Li+浓度场', status: '✓ 已完成', finding: 'SEI膜增长速率中等' }
        ],
        conclusion: '已识别热管理为关键优化点'
      }
    },
    {
      title: 'PIML 分析',
      status: 'completed',
      description: '物理信息机器学习宏观预测',
      evidence: {
        inputs: ['短测特征 (200周数据)', '仿真特征 (多物理场)', '材料参数 (数据库)'],
        outputs: ['寿命区间收敛', '因子贡献排序', '失效模式预测'],
        status: '✓ 已完成'
      }
    },
    {
      title: '报告交付',
      status: 'completed',
      description: '工程交付包',
      evidence: {
        deliverables: [
          { name: '工程报告 PDF', sections: ['Executive Summary', '测试数据', '仿真结果', 'PIML预测', '优化建议'] },
          { name: '策略参数表 CSV', fields: ['SOC窗口', '充电策略', '温度阈值', '截止电压'] },
          { name: '证据包 ZIP', contents: ['原始数据', '图谱文件', '仿真输出', '分析脚本'] }
        ],
        version: 'v1.0 (Final)'
      }
    }
  ]

  // 自定义标签样式
  const successTagStyle = {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    background: 'rgba(61,220,151,0.15)',
    color: '#3ddc97',
    border: '1px solid rgba(61,220,151,0.3)'
  }

  const blueTagStyle = {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    background: 'rgba(110,168,254,0.15)',
    color: '#6ea8fe',
    border: '1px solid rgba(110,168,254,0.3)'
  }

  const purpleTagStyle = {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    background: 'rgba(160,120,255,0.15)',
    color: '#a078ff',
    border: '1px solid rgba(160,120,255,0.3)'
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 0. Project Header - 深蓝驾驶舱主题 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(110,168,254,0.15) 0%, rgba(61,220,151,0.1) 100%)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        border: '1px solid rgba(110,168,254,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#fff' }}>
              Turbo-Dev VIP 项目 · TC-2025-001
            </h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={blueTagStyle}>来源: Turbo-Dev Online</span>
              <span style={purpleTagStyle}>Gate触发: 需要更高精度/工程背书</span>
            </div>
          </div>
          <span style={successTagStyle}>已收样</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6ea8fe', marginBottom: 4 }}>电芯型号</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>NCM811-50Ah</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6ea8fe', marginBottom: 4 }}>样品数量</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>3 pcs</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6ea8fe', marginBottom: 4 }}>到样日期</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>2024-11-20</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6ea8fe', marginBottom: 4 }}>预计周期</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>短测10周 + 分析2周</div>
          </div>
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(110,168,254,0.3)' }}>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>目标精度: </span>
              <strong style={{ color: '#3ddc97' }}>区间收敛到 ±5%</strong>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>交付类型: </span>
              <strong style={{ color: '#fff' }}>工程交付包 (报告+参数表+证据包)</strong>
            </div>
          </div>
        </div>
      </div>

      <ThreeColumnLayout
        leftPanel={
          <div>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#fff' }}>交付流程</h3>

            {/* 可展开的 Stepper */}
            <Collapse
              accordion
              ghost
              activeKey={activeStep !== null ? [activeStep] : []}
              onChange={(keys) => {
                const key = Array.isArray(keys) ? keys[0] : keys
                setActiveStep(key !== undefined ? Number(key) : null)
              }}
            >
              {stepDetails.map((step, index) => (
                <Panel
                  key={index}
                  header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: step.status === 'completed' ? '#52c41a' : step.status === 'processing' ? '#1890ff' : '#d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600
                      }}>
                        {step.status === 'completed' ? '✓' : index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, color: '#fff' }}>{step.title}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{step.description}</div>
                      </div>
                    </div>
                  }
                  style={{
                    marginBottom: 16,
                    background: step.status === 'processing' ? 'rgba(24,144,255,0.15)' : 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    border: `1px solid ${step.status === 'processing' ? 'rgba(24,144,255,0.4)' : 'rgba(255,255,255,0.14)'}`
                  }}
                >
                  {/* 展开内容 - 证据 */}
                  <div style={{ paddingLeft: 44, fontSize: 13 }}>
                    {step.evidence.photos && (
                      <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: '#fff' }}>收样照片:</strong>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                          {sampleImages.map((imgSrc, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                              <input
                                type="file"
                                accept="image/*"
                                id={`image-upload-${i}`}
                                style={{ display: 'none' }}
                                onChange={(e) => handleImageUpload(i, e)}
                              />
                              <label htmlFor={`image-upload-${i}`} style={{ cursor: 'pointer', display: 'block' }}>
                                <img
                                  src={imgSrc}
                                  alt={`图${i + 1}.jpg`}
                                  style={{
                                    width: 90,
                                    height: 90,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    transition: 'all 0.3s ease'
                                  }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  bottom: 4,
                                  left: 4,
                                  right: 4,
                                  background: 'rgba(0,0,0,0.6)',
                                  color: 'white',
                                  fontSize: 11,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  textAlign: 'center'
                                }}>
                                  图{i + 1}.jpg
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {step.evidence.records && (
                      <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: '#fff' }}>记录:</strong>
                        {step.evidence.records.map((record, i) => (
                          <div key={i} style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                            • {record.label}: {record.value}
                          </div>
                        ))}
                      </div>
                    )}
                    {step.evidence.data && (
                      <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: '#fff' }}>关键数据:</strong>
                        {step.evidence.data.map((item, i) => (
                          <div key={i} style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                            • {item.label}: <strong style={{ color: '#fff' }}>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                    {step.evidence.charts && (
                      <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: '#fff' }}>图谱:</strong>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={blueTagStyle}>容量衰减曲线</span>
                          <span style={blueTagStyle}>内阻增长曲线</span>
                          <span style={blueTagStyle}>dQ/dV曲线</span>
                        </div>
                      </div>
                    )}
                    {step.evidence.simulations && (
                      <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: '#fff' }}>仿真结果:</strong>
                        {step.evidence.simulations.map((sim, i) => (
                          <div key={i} style={{ marginTop: 6, fontSize: 12 }}>
                            <div style={{ color: '#fff' }}><strong>{sim.status}</strong> {sim.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>→ {sim.finding}</div>
                          </div>
                        ))}
                        <div style={{ marginTop: 8, padding: 8, background: 'rgba(110,168,254,0.15)', borderRadius: 4, fontSize: 12, color: '#6ea8fe' }}>
                          💡 {step.evidence.conclusion}
                        </div>
                      </div>
                    )}
                    {step.evidence.inputs && (
                      <div>
                        <div style={{ marginBottom: 6, color: '#fff' }}><strong>输入:</strong></div>
                        {step.evidence.inputs.map((input, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginLeft: 12 }}>• {input}</div>
                        ))}
                        <div style={{ marginTop: 8, marginBottom: 6, color: '#fff' }}><strong>预期输出:</strong></div>
                        {step.evidence.outputs.map((output, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginLeft: 12 }}>• {output}</div>
                        ))}
                        <div style={{ marginTop: 8, fontSize: 12, color: '#fa8c16' }}>{step.evidence.status}</div>
                      </div>
                    )}
                    {step.evidence.deliverables && (
                      <div>
                        {step.evidence.deliverables.map((item, i) => (
                          <div key={i} style={{ marginBottom: 12 }}>
                            <strong style={{ color: '#fff' }}>{item.name}</strong>
                            {item.sections && (
                              <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                                章节: {item.sections.join(' · ')}
                              </div>
                            )}
                            {item.fields && (
                              <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                                字段: {item.fields.join(' · ')}
                              </div>
                            )}
                            {item.contents && (
                              <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                                内容: {item.contents.join(' · ')}
                              </div>
                            )}
                          </div>
                        ))}
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>版本: {step.evidence.version}</div>
                      </div>
                    )}
                  </div>
                </Panel>
              ))}
            </Collapse>

            {/* 当前进度卡片 */}
            <div style={{
              marginTop: 24,
              padding: 16,
              background: 'rgba(61,220,151,0.1)',
              borderRadius: 6,
              border: '1px solid rgba(61,220,151,0.3)'
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#3ddc97', marginBottom: 8 }}>
                项目状态
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                ✓ 全部流程已完成<br />
                工程交付包已生成
              </div>
            </div>
          </div>
        }

        centerPanel={
          <div>
            {/* 阶段产出条 - 深色主题 */}
            <div style={{
              background: 'rgba(61,220,151,0.1)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              border: '1px solid rgba(61,220,151,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={successTagStyle}>短测试完成</span>
                  <span style={successTagStyle}>仿真完成</span>
                  <span style={successTagStyle}>PIML完成</span>
                  <span style={successTagStyle}>已交付</span>
                </div>
                <Button size="small" type="primary" icon={<FileTextOutlined />}>
                  工程报告 v1.0
                </Button>
              </div>
              <div style={{ fontSize: 12, color: '#3ddc97', fontWeight: 500 }}>
                ✓ 项目全部完成，工程交付包已生成
              </div>
            </div>

            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#fff' }}>阶段结果面板</h3>

            {/* 0. 样品接收确认 */}
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>0. 样品接收确认</h4>
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>📦</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>电芯样品照片</span>
                  </div>
                  <span style={successTagStyle}>已接收</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                    <img src={sampleImages[0]} alt="收样照片1" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }} />
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>图1.jpg - 样品外观</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                    <img src={sampleImages[1]} alt="收样照片2" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }} />
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>图2.jpg - 样品标签</div>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  padding: 12,
                  background: 'rgba(61,220,151,0.1)',
                  borderRadius: 6,
                  border: '1px solid rgba(61,220,151,0.3)'
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#52c41a', marginBottom: 2 }}>样品编号</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>TC-2025-001-A/B/C</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#52c41a', marginBottom: 2 }}>重量</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>152.3g / 152.1g / 152.4g</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#52c41a', marginBottom: 2 }}>外观检查</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>✓ 无异常</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#52c41a', marginBottom: 2 }}>安全检查</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>✓ 通过</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. 短测结论卡 */}
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>1. 短测试数据验证</h4>
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)',
                marginBottom: 16
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: 16,
                  marginBottom: 16
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>初始容量</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>50.2 Ah</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>200周后</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>48.8 Ah</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>衰减率</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>2.8%</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>
                  短测试表现良好，衰减速率符合预期；已进入仿真阶段用于定位热点与风险。
                </div>
                <Button size="small" onClick={() => setEvidenceModalVisible(true)}>
                  <EyeOutlined /> 查看证据
                </Button>
              </div>

              {/* 容量衰减曲线 */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>📉</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>容量衰减曲线</span>
                  </div>
                  <span style={successTagStyle}>已完成</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, marginBottom: 12, textAlign: 'center' }}>
                  <img src="/images/echem-capacity.png" alt="容量衰减曲线" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                  <div><strong style={{ color: '#fff' }}>结论:</strong> 200周循环后容量保持率 97.2%，衰减速率稳定</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    • 初始容量 50.2Ah，200周后 48.8Ah<br />
                    • 衰减曲线呈线性趋势，无异常跳变
                  </div>
                </div>
              </div>

              {/* dQ/dV 曲线分析 */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>📊</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>dQ/dV 曲线分析</span>
                  </div>
                  <span style={successTagStyle}>已完成</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, marginBottom: 12, textAlign: 'center' }}>
                  <img src="/images/echem-dQdV-heatmap.png" alt="dQ/dV 曲线热图" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                  <div><strong style={{ color: '#fff' }}>结论:</strong> dQ/dV 峰位随循环稳定，材料结构无明显相变</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    • 主峰位于 3.6V 附近，峰高逐渐降低表明活性材料损失<br />
                    • 未观察到明显的峰位偏移，排除严重结构相变
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 多物理场仿真 (COMSOL) */}
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>2. 多物理场仿真 (COMSOL)</h4>

              {/* 温度场分布 */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>🌡️</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>温度场分布</span>
                  </div>
                  <span style={successTagStyle}>已完成</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, marginBottom: 12, textAlign: 'center' }}>
                  <img src="/images/inspect/热点聚焦.png" alt="温度场分布" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                  <div><strong style={{ color: '#fff' }}>发现:</strong> 热点位于极耳连接处</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    • 最高温升: <span style={{ color: '#ff6b6b' }}>12°C</span> (阈值: 10°C)<br />
                    • 建议优化极耳散热设计
                  </div>
                </div>
                <Button size="small" style={{ marginTop: 12 }} onClick={() => setHotspotModalVisible(true)}>
                  <EyeOutlined /> 查看详情
                </Button>
              </div>

              {/* 电流密度场 */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>⚡</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>电流密度场</span>
                  </div>
                  <span style={successTagStyle}>已完成</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, marginBottom: 12, textAlign: 'center' }}>
                  <img src="/images/inspect/current_density_1.png" alt="电流密度场" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                  <div><strong style={{ color: '#fff' }}>发现:</strong> 电流分布均匀</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    • 无明显电流集中区域<br />
                    • 极片利用率: <span style={{ color: '#3ddc97' }}>92%</span>
                  </div>
                </div>
                <Button size="small" style={{ marginTop: 12 }} onClick={() => setCurrentDensityModalVisible(true)}>
                  <EyeOutlined /> 查看详情
                </Button>
              </div>

              {/* 机械应力场 */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>🔧</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>机械应力场</span>
                  </div>
                  <span style={successTagStyle}>已完成</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, marginBottom: 12, textAlign: 'center' }}>
                  <img src="/images/inspect/stress_distribution.png" alt="机械应力场" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                  <div><strong style={{ color: '#fff' }}>发现:</strong> 应力可控</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    • 隔膜最大应力: <span style={{ color: '#3ddc97' }}>45 MPa</span> (阈值: 80 MPa)<br />
                    • 极片膨胀率: 3.2%
                  </div>
                </div>
                <Button size="small" style={{ marginTop: 12 }} onClick={() => setStressModalVisible(true)}>
                  <EyeOutlined /> 查看详情
                </Button>
              </div>

              {/* Li+浓度场 */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>🔬</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>Li+浓度场</span>
                  </div>
                  <span style={successTagStyle}>已完成</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                    <img src="/images/inspect/comsol_4.png" alt="颗粒内锂浓度" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }} />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>活性材料颗粒内锂离子浓度分布</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                    <img src="/images/inspect/comsol_8.png" alt="多颗粒浓度场" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }} />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>电极多颗粒Li+浓度场分布</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                  <div><strong style={{ color: '#fff' }}>发现:</strong> 锂离子扩散行为正常</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    • 不同倍率下颗粒内浓度梯度变化符合预期<br />
                    • 电极内Li+浓度分布均匀，无明显极化区域
                  </div>
                </div>
              </div>

              {/* 仿真总结 */}
              <div style={{
                padding: 16,
                background: 'rgba(110,168,254,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(110,168,254,0.3)'
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#6ea8fe', marginBottom: 8 }}>💡 仿真总结</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                  已识别<strong style={{ color: '#ff6b6b' }}>热管理</strong>为关键优化点，极耳温升超出阈值；
                  电流分布和机械应力均在安全范围内。
                </div>
              </div>
            </div>

            {/* 3. PIML 分析 */}
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>3. PIML 宏观预测</h4>
              <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.14)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>🧠</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>物理信息机器学习</span>
                  </div>
                  <span style={successTagStyle}>已完成</span>
                </div>

                {/* 模型输入特征 - 三张卡片 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 12 }}>模型输入特征</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {/* 短测特征 */}
                    <div style={{
                      background: 'rgba(110,168,254,0.1)',
                      borderRadius: 8,
                      padding: 14,
                      border: '1px solid rgba(110,168,254,0.3)'
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#6ea8fe', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>📊</span>
                        短测特征
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                        • 容量衰减曲线<br />
                        • dQ/dV特征峰<br />
                        • 内阻变化趋势
                      </div>
                    </div>

                    {/* 仿真特征 */}
                    <div style={{
                      background: 'rgba(61,220,151,0.1)',
                      borderRadius: 8,
                      padding: 14,
                      border: '1px solid rgba(61,220,151,0.3)'
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#3ddc97', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>🔬</span>
                        仿真特征
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                        • 温度场分布<br />
                        • 电流密度场<br />
                        • Li+浓度梯度
                      </div>
                    </div>

                    {/* 材料参数 */}
                    <div style={{
                      background: 'rgba(255,204,102,0.1)',
                      borderRadius: 8,
                      padding: 14,
                      border: '1px solid rgba(255,204,102,0.3)'
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ffcc66', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>⚗️</span>
                        材料参数
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                        • 正极材料参数<br />
                        • 负极材料参数<br />
                        • 电解液参数
                      </div>
                    </div>
                  </div>
                </div>

                {/* 寿命预测结果 - 两张图并排 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 12 }}>寿命预测结果</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                      <img src="/images/piml-prediction.png" alt="寿命预测" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }} />
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>寿命预测区间收敛</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                      <img src="/images/piml-failure.png" alt="失效原因分析" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }} />
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>失效原因分析</div>
                    </div>
                  </div>
                </div>

                {/* 因子贡献排序 */}
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  <strong style={{ color: '#fff' }}>因子贡献排序:</strong>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 60, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>温度</div>
                      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: '42%', height: '100%', background: '#ff6b6b', borderRadius: 4 }} />
                      </div>
                      <div style={{ width: 40, fontSize: 11, color: '#ff6b6b' }}>42%</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 60, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>SEI膜</div>
                      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: '28%', height: '100%', background: '#fadb14', borderRadius: 4 }} />
                      </div>
                      <div style={{ width: 40, fontSize: 11, color: '#fadb14' }}>28%</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 60, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>倍率</div>
                      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: '18%', height: '100%', background: '#6ea8fe', borderRadius: 4 }} />
                      </div>
                      <div style={{ width: 40, fontSize: 11, color: '#6ea8fe' }}>18%</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>其他</div>
                      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: '12%', height: '100%', background: 'rgba(255,255,255,0.4)', borderRadius: 4 }} />
                      </div>
                      <div style={{ width: 40, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>12%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        rightPanel={
          <div ref={reportSidebarRef}>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#fff' }}>预测结论与交付</h3>

            {/* VIP 精准预测 + Online 对比 - 深色主题 */}
            <div style={{
              padding: 24,
              background: 'linear-gradient(135deg, rgba(110,168,254,0.2) 0%, rgba(61,220,151,0.15) 100%)',
              borderRadius: 8,
              marginBottom: 24,
              border: '1px solid rgba(110,168,254,0.4)'
            }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>VIP 精准预测</div>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                {vipResult.lifespanRange.min}-{vipResult.lifespanRange.max}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 16 }}>cycles (置信度 92%)</div>

              {/* Online 对比 - 新增 */}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.3)',
                paddingTop: 12,
                fontSize: 13,
                color: 'rgba(255,255,255,0.95)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ opacity: 0.8, fontSize: 11 }}>Online</div>
                    <div>{onlineResult.lifespanRange.min}–{onlineResult.lifespanRange.max} (置信度 {onlineResult.confidence === 'high' ? '高' : onlineResult.confidence === 'medium' ? '中' : '低'})</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.8, fontSize: 11 }}>VIP</div>
                    <div>{vipResult.lifespanRange.min}–{vipResult.lifespanRange.max} (置信度 高)</div>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: 8,
                  borderRadius: 4,
                  fontSize: 12,
                  textAlign: 'center'
                }}>
                  ✨ 区间收窄 {improvement.intervalNarrowing}% · 置信度提升 {improvement.confidenceImprovement}
                </div>
              </div>
            </div>

            {/* 机理分析模块 - 失效模式 Top2 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningFilled style={{ color: '#ff6b6b' }} />
                失效模式 Top2
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: 16
              }}>
                {failureModes.map((mode, i) => (
                  <div key={i} style={{ marginBottom: i < failureModes.length - 1 ? 16 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: mode.color, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 600
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{mode.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>({mode.mode})</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: mode.color }}>{mode.probability}%</span>
                    </div>
                    <Progress
                      percent={mode.probability}
                      showInfo={false}
                      strokeColor={mode.color}
                      trailColor="rgba(255,255,255,0.1)"
                      size="small"
                    />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{mode.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 结论卡 - 深色主题 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: '#fff' }}>工程结论 Top3</div>
              <div style={{
                padding: 16,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 6,
                fontSize: 13,
                color: 'rgba(255,255,255,0.65)'
              }}>
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: '#fff' }}>1. 温度是主要影响因素</strong>
                  <div>极耳热点温升 12°C，建议优化散热设计</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: '#fff' }}>2. SEI 膜生长适中</strong>
                  <div>贡献约 15% 的容量损失，可接受范围内</div>
                </div>
                <div>
                  <strong style={{ color: '#fff' }}>3. 机械应力可控</strong>
                  <div>隔膜承受应力在安全阈值以内</div>
                </div>
              </div>
            </div>

            {/* 导出报告长图 */}
            <Button
              block
              size="large"
              icon={exportingImage ? <LoadingOutlined /> : <CameraOutlined />}
              style={{ marginBottom: 12, background: 'rgba(110,168,254,0.15)', border: '1px solid rgba(110,168,254,0.4)', color: '#6ea8fe' }}
              onClick={exportReportImage}
              disabled={exportingImage}
            >
              {exportingImage ? '正在生成...' : '导出报告长图（PNG）'}
            </Button>

            <Button
              type="primary"
              size="large"
              block
              icon={generating ? <LoadingOutlined /> : <DownloadOutlined />}
              style={{ marginBottom: 12 }}
              onClick={generateReport}
              disabled={generating}
            >
              {generating ? '正在生成...' : '生成工程报告'}
            </Button>

            <Button
              size="large"
              block
            >
              预约专家解读
            </Button>
          </div>
        }
      />

      {/* 证据链弹窗 */}
      <Modal
        title="证据链 - 温度影响因素"
        open={evidenceModalVisible}
        onCancel={() => setEvidenceModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ fontSize: 13 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>现象</div>
            <div style={{ color: '#666' }}>• 200周循环后容量衰减2.8%，略高于预期</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>指标</div>
            <div style={{ color: '#666' }}>
              • DCIR增长8.3% (正常范围: 5-7%)<br />
              • 极耳区域温升12°C (阈值: 10°C)
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>机理</div>
            <div style={{ color: '#666' }}>
              • 仿真显示极耳连接处为热点<br />
              • 高温加速SEI膜生长，贡献15%容量损失<br />
              • 温度场不均匀导致局部Li+浓度梯度增大
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>排除项</div>
            <div style={{ color: '#666' }}>
              ✓ 电流分布均匀，排除电接触问题<br />
              ✓ 机械应力可控，排除极片膨胀影响<br />
              ✓ Li析出风险低，排除过充问题
            </div>
          </div>
        </div>
      </Modal>

      {/* 热点分析弹窗 */}
      <Modal
        title="温度场分布 - 详细分析"
        open={hotspotModalVisible}
        onCancel={() => setHotspotModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ fontSize: 13 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/images/inspect/热点聚焦.png" alt="温度场分布" style={{ maxWidth: '100%', maxHeight: 300 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#ff6b6b' }}>热点位置</div>
              <div style={{ color: '#666' }}>
                • 极耳连接处 (正极侧)<br />
                • 电芯中心区域
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>温度数据</div>
              <div style={{ color: '#666' }}>
                • 最高温度: 47°C<br />
                • 平均温度: 38°C<br />
                • 温差: 12°C
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 6, border: '1px solid #ffd591' }}>
            <strong style={{ color: '#fa8c16' }}>⚠️ 建议:</strong> 优化极耳散热设计，增加导热垫或调整极耳布局
          </div>
        </div>
      </Modal>

      {/* 电流密度弹窗 */}
      <Modal
        title="电流密度场 - 详细分析"
        open={currentDensityModalVisible}
        onCancel={() => setCurrentDensityModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ fontSize: 13 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/images/inspect/current_density_1.png" alt="电流密度场" style={{ maxWidth: '100%', maxHeight: 300 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#52c41a' }}>分布特征</div>
              <div style={{ color: '#666' }}>
                • 电流分布均匀<br />
                • 无明显集中区域<br />
                • 边缘效应可控
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>关键指标</div>
              <div style={{ color: '#666' }}>
                • 极片利用率: 92%<br />
                • 最大电流密度: 2.1 A/cm²<br />
                • 均匀性指数: 0.94
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
            <strong style={{ color: '#52c41a' }}>✓ 结论:</strong> 电流分布良好，无需额外优化
          </div>
        </div>
      </Modal>

      {/* 机械应力弹窗 */}
      <Modal
        title="机械应力场 - 详细分析"
        open={stressModalVisible}
        onCancel={() => setStressModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ fontSize: 13 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/images/inspect/stress_distribution.png" alt="机械应力场" style={{ maxWidth: '100%', maxHeight: 300 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#52c41a' }}>应力分布</div>
              <div style={{ color: '#666' }}>
                • 隔膜应力在安全范围<br />
                • 极片膨胀可控<br />
                • 无褶皱风险
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>关键指标</div>
              <div style={{ color: '#666' }}>
                • 隔膜最大应力: 45 MPa<br />
                • 安全阈值: 80 MPa<br />
                • 极片膨胀率: 3.2%
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
            <strong style={{ color: '#52c41a' }}>✓ 结论:</strong> 机械应力可控，结构设计满足要求
          </div>
        </div>
      </Modal>
    </div>
  )
}
