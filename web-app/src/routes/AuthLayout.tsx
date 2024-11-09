// src/components/AuthLayout.tsx
import React, { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Button, Layout, Menu } from 'antd'
import { useAuth } from '../context/AuthContext'
import { authRoutes, RouteConfig } from './routes'
import { useSelector } from 'react-redux'
import { getSidbarCollapsed } from '@/features/settings/selectors'

const { Content, Sider } = Layout

type MenuItem = {
  key: string
  label: ReactNode
  children?: MenuItem[]
}

const AuthLayout: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth()
  const sidbarCfdsfollapsed = useSelector(getSidbarCollapsed)

  const filterValidMenus = (routes: RouteConfig[], parentPath = ''): MenuItem[] => {
    return routes.flatMap(route => {
      const { requiresAuth, path, name, hidden, children } = route
      const fullPath = `${parentPath}${path}/`

      if (hidden || (requiresAuth && !isAuthenticated)) {
        return []
      }

      const menuItem: MenuItem = {
        key: fullPath,
        label: <Link to={fullPath}>{name}</Link>,
      }

      if (children) {
        menuItem.children = filterValidMenus(children, fullPath)
      }

      return menuItem.children?.length ? [menuItem] : [menuItem]
    })
  }

  const menuItems = filterValidMenus(authRoutes)

  return (
    <Layout>
      <Sider
        width={200}
        trigger={null}
        collapsedWidth={0}
        collapsible
        collapsed={sidbarCfdsfollapsed}
      >
        <div className=" flex justify-center py-2">
          {isAuthenticated ? (
            <Button onClick={logout} type="primary">
              Logout
            </Button>
          ) : (
            <Button onClick={login} type="primary">
              Login
            </Button>
          )}
        </div>
        <Menu theme="dark" mode="vertical" items={menuItems} />
      </Sider>
      <Content style={{ padding: '0px' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default AuthLayout
