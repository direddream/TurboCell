import type { ThemeConfig } from 'antd'
import { theme as antdTheme } from 'antd'

export const antdThemeConfig: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: 'var(--primary)',
    colorSuccess: 'var(--success)',
    colorWarning: 'var(--warning)',
    colorError: 'var(--danger)',

    colorText: 'var(--text-primary)',
    colorTextSecondary: 'var(--text-secondary)',
    colorTextTertiary: 'var(--text-muted)',

    colorBgLayout: 'var(--bg-page)',
    colorBgContainer: 'var(--bg-card)',
    colorBgElevated: 'var(--bg-elevated)',

    colorBorder: 'var(--border)',

    fontFamily:
      "Inter, PingFang SC, 'Microsoft YaHei', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    fontWeightStrong: 600,
    borderRadius: 12,
  },
}

