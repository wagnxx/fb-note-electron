// src/components/AuthLayout.tsx
import React, { ReactNode, useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button, Layout, Menu } from 'antd'
import { useAuth } from '../context/AuthContext'
import { authRoutes, RouteConfig } from './routes'
import { useDispatch, useSelector } from 'react-redux'
import { getSidbarCollapsed } from '@/features/settings/selectors'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth, logoutUser } from '@/firebase/authService'
import { clearAuthState, setAuthState } from '@/features/auth/authSlice'
import { showConfirmationDialog } from '@/utils/utilsConfirm'

const { Content, Sider } = Layout

type MenuItem = {
  key: string
  label: ReactNode
  children?: MenuItem[]
}

const AuthLayout: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()

  const sidbarCfdsfollapsed = useSelector(getSidbarCollapsed)

  const dispatch = useDispatch() // Redux 使用

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        dispatch(
          setAuthState({
            isAuthenticated: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            },
          }),
        )
      } else {
        dispatch(clearAuthState())
      }
    })

    return () => unsubscribe()
  }, [dispatch])

  const handleLogin = async () => {
    navigate('/login')
  }
  const handleLogout = async () => {
    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to logout?`,
    })

    if (!confirmed) return
    await logoutUser()
    logout()
  }

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
            <>
              <span style={{ color: '#fff' }}>{user?.displayName || user?.email}</span>

              <Button onClick={handleLogout} type="text" size="small" danger>
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={handleLogin} type="primary" size="small">
              Login
            </Button>
          )}
        </div>
        <Menu theme="dark" mode="inline" items={menuItems} />
      </Sider>
      <Content style={{ padding: '0px', height: 'calc(100vh - 28px)', overflow: 'auto' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default AuthLayout
