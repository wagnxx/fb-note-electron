import React, { ReactNode } from 'react'
import { Empty, Layout, Menu, theme } from 'antd'
import { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'

const { Header, Content, Footer, Sider } = Layout

export type MenuItem = {
  key: string
  icon?: React.FunctionComponentElement<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >
  label?: string
}

export type PageLayoutProps = {
  menu: MenuItem[]
  onMenuItemSelected: (info: MenuItem) => void
  children?: ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ menu, onMenuItemSelected, children }) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={broken => {
          console.log(broken)
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type)
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['4']}
          items={menu}
          onSelect={onMenuItemSelected}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0' }} className={'flex-1 h-full'}>
          <div
            style={{
              padding: 16,
              minHeight: 'calc(100vh - 80px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children ? children : <Empty />}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  )
}

export default PageLayout
