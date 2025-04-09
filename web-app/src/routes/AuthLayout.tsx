// src/components/AuthLayout.tsx
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button, Layout, Menu, Spin } from 'antd'
import { authRoutes, RouteConfig } from './routes'
import { useSelector } from 'react-redux'
import { getSidbarCollapsed } from '@/features/settings/selectors'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth, logoutUser } from '@/firebase/authService'
import { clearAuthState, setAuthState } from '@/features/auth/authSlice'
import { useNotification } from '@/hooks/useNotification'
import { RootState } from '@/store/store'
import useUserRole, { calculateRoleValue } from '@/features/rolePermission/hooks/useUserRole'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchMenuItems, fetchPermissions } from '@/features/rolePermission'

const { Content, Sider } = Layout

type MenuItem = {
  key: string
  label: ReactNode
  children?: MenuItem[]
}

const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { menuItems, permissions } = useAppSelector(state => state.rolePermission)
  const dispatch = useAppDispatch()
  const { totalPermissionsValue } = useUserRole()
  const navigate = useNavigate()
  const sidebarCollapsed = useSelector(getSidbarCollapsed)
  const { showConfirmationDialog } = useNotification()
  // 新增 loading 状态
  const [isMenuLoaded, setIsMenuLoaded] = useState(false)

  useEffect(() => {
    if (menuItems.length > 0) {
      setIsMenuLoaded(true) // menuItems 加载完成后更新状态
    }
  }, [menuItems])

  useEffect(() => {
    dispatch(fetchMenuItems())
    dispatch(fetchPermissions())
  }, [dispatch])

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
    const confirmed = await showConfirmationDialog({
      content: `Are you sure you want to logout?`,
    })

    if (!confirmed) return
    await logoutUser()
    dispatch(clearAuthState())
  }

  const computeRolePermissions = useCallback(
    (route: RouteConfig) => {
      const menuItem = menuItems.find(item => item.key === route.name)
      if (!menuItem) return true
      const menuPermKeys = menuItem.permissions.filter(p => p !== '*')
      if (menuPermKeys.length === 0) return true

      const menuPermIndexes = permissions.filter(item => menuPermKeys.includes(item.key)).map(item => item.index)

      const menuPermValue = calculateRoleValue(menuPermIndexes)
      return (totalPermissionsValue & menuPermValue) !== 0n
    },
    [menuItems, permissions, totalPermissionsValue],
  )

  const filterValidMenus = useCallback(
    (routes: RouteConfig[], parentPath = ''): MenuItem[] => {
      return routes.flatMap(route => {
        const { requiresAuth, path, name, hidden, children } = route
        const fullPath = `${parentPath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

        const hasPermission = computeRolePermissions(route)

        if (!hasPermission || hidden || (requiresAuth && !isAuthenticated)) {
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
    },
    [computeRolePermissions, isAuthenticated],
  )

  const validMenuItems = useMemo(() => filterValidMenus(authRoutes), [filterValidMenus])

  return (
    <Layout>
      <Sider width={200} trigger={null} collapsedWidth={0} collapsible collapsed={sidebarCollapsed}>
        <div className="flex justify-center py-2">
          {isAuthenticated ? (
            <>
              <Button type="text" size="small" style={{ color: '#fff' }} onClick={() => navigate('/userProfile')}>
                {user?.displayName || user?.email}
              </Button>
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
        {/* <Menu theme="dark" mode="inline" items={validMenuItems} /> */}
        <Spin
          spinning={!isMenuLoaded}
          tip={<span style={{ textShadow: 'none' }}>Loading menu...</span>}
          className="flex justify-center  items-center  "
          style={{ height: '100vh' }}
        >
          {isMenuLoaded && validMenuItems.length === 0 ? (
            <div>No menu items available</div> // 没有有效菜单项时的提示
          ) : (
            <Menu theme="dark" mode="inline" items={isMenuLoaded ? validMenuItems : []} />
          )}
        </Spin>
      </Sider>
      <Content style={{ padding: '0px', height: 'calc(100vh - 28px)', overflow: 'auto' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default AuthLayout
