// src/components/AuthLayout.tsx
import React, { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Button, Flex, Layout, Menu } from 'antd'
import { useAuth } from '../context/AuthContext'
import { authRoutes, RouteConfig } from './routes'

const { Header, Content } = Layout

type MenuItem = {
  key: string
  label: ReactNode
  children?: MenuItem[]
}

const AuthLayout: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth()

  const filterValidMenus = (routes: RouteConfig[], parentPath = ''): MenuItem[] => {
    return routes.flatMap(route => {
      const { requiresAuth, path, name, hidden, children } = route
      const fullPath = `${parentPath}${path}`

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
      <Header>
        <Flex justify="space-between">
          <Menu style={{ flex: 1 }} theme="dark" mode="horizontal" items={menuItems} />
          <div>
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
        </Flex>
      </Header>
      <Content style={{ padding: '0px' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default AuthLayout
