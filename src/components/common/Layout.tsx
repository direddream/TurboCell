import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BulbOutlined, ExportOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Input, Switch } from 'antd'

export function Layout(props: { children: ReactNode }) {
  return (
    <div className="appShell">
      <header className="topBar">
        <div className="topBarInner layoutHeaderInner">
          <div className="layoutHeaderLeft">
            <Link to="/" className="layoutBrand">
              <BulbOutlined className="layoutBrandIcon" />
              <span className="layoutBrandText">TurboCell</span>
            </Link>

            <select className="layoutProjectSelect">
              <option>当前项目：演示项目A</option>
              <option>项目B</option>
              <option>项目C</option>
            </select>
          </div>

          <div className="layoutHeaderCenter">
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="搜索项目、电芯、报告..."
              style={{ borderRadius: 999 }}
            />
          </div>

          <div className="layoutHeaderRight">
            <div className="layoutHeaderToggle">
              <span className="layoutHeaderToggleLabel">演示模式</span>
              <Switch defaultChecked />
            </div>

            <Button icon={<ExportOutlined />} type="default">
              导出中心
            </Button>

            <Button icon={<UserOutlined />} type="primary" shape="circle" />
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>{props.children}</main>

      <footer className="layoutFooter">演示模式 · 计算结果仅供产品概念展示</footer>
    </div>
  )
}
