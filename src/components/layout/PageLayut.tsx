import React, { ReactNode, useState } from 'react'
import { Button, Empty, Layout, Menu, theme } from 'antd'
import { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'

const { Content, Sider } = Layout

export type MenuItem = {
  key: string
  icon?: React.FunctionComponentElement<Omit<AntdIconProps, 'ref'>>
  label?: string
  component?: React.ComponentType // 组件可以是任意 ReactNode 类型
  children?: MenuItem[] // 添加 children 属性以支持子菜单
}

export type PageLayoutProps = {
  menu: MenuItem[]
  onMenuItemSelected: (info: MenuItem) => void
  children?: ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ menu, onMenuItemSelected, children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="40" collapsed={collapsed} trigger={null}>
        <div
          style={{
            background: colorBgContainer,
            // padding: '10px',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'space-between',
            alignItems: 'center',
          }}
        >
          {!collapsed ? <span style={{ paddingLeft: '10px' }}>FB Note Electron</span> : ''}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
        </div>

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['4']}
          items={menu}
          onSelect={onMenuItemSelected}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: '0' }} className={'flex-1 h-full'}>
          {children ? children : <Empty />}
        </Content>
      </Layout>
    </Layout>
  )
}

export default PageLayout
