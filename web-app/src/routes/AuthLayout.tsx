// src/components/AuthLayout.tsx
import React, { ReactNode, useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button, Layout, Menu } from 'antd'
import { authRoutes, RouteConfig } from './routes'
import { useSelector } from 'react-redux'
import { getSidbarCollapsed } from '@/features/settings/selectors'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth, logoutUser } from '@/firebase/authService'
import { clearAuthState, setAuthState } from '@/features/auth/authSlice'
import { useNotification } from '@/hooks/useNotification'
import { RootState } from '@/store/store'
import useUserRole from '@/features/rolePermission/hooks/useUserRole'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchMenuItems, fetchPermissions } from '@/features/rolePermission'

const { Content, Sider } = Layout

type MenuItem = {
  key: string
  label: ReactNode
  children?: MenuItem[]
}

const AuthLayout: React.FC = () => {
  // const { isAuthenticated, logout, user } = useAuth()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { menuItems, permissions } = useAppSelector(state => state.rolePermission)
  const dispatch = useAppDispatch()
  const { totalPermissionsValue } = useUserRole()

  const navigate = useNavigate()

  const sidbarCfdsfollapsed = useSelector(getSidbarCollapsed)

  // const dispatch = useDispatch() // Redux 使用
  const { showConfirmationDialog } = useNotification()

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
    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to logout?`,
    })

    if (!confirmed) return
    await logoutUser()
    dispatch(clearAuthState())
  }

  const computeRolePermissions = (route: RouteConfig) => {
    const menuItem = menuItems.find(item => item.key === route.name)

    if (!menuItem) return true

    const menuPerKeys = menuItem.permissions.filter(item => item !== '*') // not allowed in memu role
    const menuPerm = permissions.filter(item => menuPerKeys.includes(item.key))
    const menuRolePermValue = menuPerm.reduce((pre, cur) => {
      return pre | cur.value
    }, 0)

    return (totalPermissionsValue & menuRolePermValue) > 0
  }

  const filterValidMenus = (routes: RouteConfig[], parentPath = ''): MenuItem[] => {
    return routes.flatMap(route => {
      const { requiresAuth, path, name, hidden, children } = route
      const fullPath = `${parentPath}${path}/`

      const hasPer = computeRolePermissions(route)

      if (!hasPer || hidden || (requiresAuth && !isAuthenticated)) {
        return []
      }

      const menuItem: MenuItem = {
        key: fullPath,
        // label: children ? name : <Link to={fullPath}>{name}</Link>,
        label: <Link to={fullPath}>{name}</Link>,
      }

      if (children) {
        menuItem.children = filterValidMenus(children, fullPath)
      }

      return menuItem.children?.length ? [menuItem] : [menuItem]
    })
  }

  const validMenuItems = filterValidMenus(authRoutes)

  return (
    <Layout>
      <Sider width={200} trigger={null} collapsedWidth={0} collapsible collapsed={sidbarCfdsfollapsed}>
        <div className=" flex justify-center py-2">
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
        <Menu theme="dark" mode="inline" items={validMenuItems} />
      </Sider>
      <Content style={{ padding: '0px', height: 'calc(100vh - 28px)', overflow: 'auto' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default AuthLayout
