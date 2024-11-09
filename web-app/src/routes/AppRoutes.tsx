// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { standaloneRoutes, authRoutes, RouteConfig } from './routes'
import PrivateRoute from './PrivateRoute'
import { AuthProvider } from '@/context/AuthContext'
import AppHeader from '@/components/layout/AppHeader'

const RoutesList: React.FC = () => {
  return (
    <Router>
      <AppHeader />
      <Routes>
        {/* 渲染独立页面 */}
        {standaloneRoutes.map(route => {
          const { path, component: Component } = route
          return <Route key={path} path={path} element={<Component />} />
        })}

        {/* 渲染带 AuthLayout 的页面 */}
        <Route element={<AuthLayout />}>{authRoutes.map(route => renderAuthRoute(route))}</Route>
      </Routes>
    </Router>
  )
}

// 辅助函数用于递归渲染带 AuthLayout 的路由
const renderAuthRoute = (route: RouteConfig, parentPath = '') => {
  const { path, requiresAuth, component: Component, children } = route
  const fullPath = `${parentPath}${path}/`

  return (
    <React.Fragment key={fullPath}>
      {requiresAuth ? (
        <Route path={fullPath} element={<PrivateRoute element={<Component />} />} />
      ) : (
        <Route path={fullPath} element={<Component />} />
      )}
      {children && children.map(child => renderAuthRoute(child, fullPath))}
    </React.Fragment>
  )
}

export default () => (
  <AuthProvider>
    <RoutesList />
  </AuthProvider>
)
