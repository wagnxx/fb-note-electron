// src/components/AuthLayout.tsx
import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Button, Flex, Layout, Menu } from 'antd'
import { useAuth } from '../context/AuthContext'
import PrivateRoute from './PrivateRoute'
import routes from './routes'

const { Header, Content } = Layout

const AuthLayout: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth()

  const menuItems = routes
    .map(route => {
      const { requiresAuth, path, name, hidden } = route

      if (hidden) {
        return null
      }

      if (requiresAuth && !isAuthenticated) {
        return null // 不显示需要认证的路由项
      }

      return {
        key: path,
        label: <Link to={path}>{name}</Link>,
      }
    })
    .filter(Boolean) // 移除 null 项

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
      <Content style={{ padding: '8px' }}>
        <Routes>
          {routes.map(route => {
            const { requiresAuth, component: Component, path } = route
            return requiresAuth ? (
              <Route key={path} path={path} element={<PrivateRoute element={<Component />} />} />
            ) : (
              <Route key={path} path={path} element={<Component />} />
            )
          })}
        </Routes>
      </Content>
    </Layout>
  )
}

export default AuthLayout
