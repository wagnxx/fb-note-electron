// src/components/AuthLayout.tsx
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button, Empty, Layout, Menu, Spin } from 'antd'
import { authRoutes, getUnrequiresAuthRoutes, RouteConfig } from './routes'
import { useSelector } from 'react-redux'
import { getSidbarCollapsed } from '@/features/settings/selectors'
import { logoutUser } from '@/firebase/authService'
import { clearAuthState } from '@/features/auth/authSlice'
import { useNotification } from '@/hooks/useNotification'
import useUserRole from '@/features/rolePermission/hooks/useUserRole'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  calculateRoleValueFromValue,
  fetchMenuItems,
  hasPermissionByValue,
  SystemMenuItem,
} from '@/features/rolePermission'
import { useInitAuthEffect } from '@/hooks/useInitAuthEffect'
import { isElectron } from '@/utils/utilsSystem'

const { Content, Sider } = Layout

type MenuItem = {
  key: string
  label: ReactNode
  children?: MenuItem[]
}

const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth)
  const menuItems = useAppSelector(state => state.rolePermission.menuItems)
  const dispatch = useAppDispatch()
  const { totalPermissionsValue, canCheckPermission, permissionsKeyValue } = useUserRole()
  const navigate = useNavigate()
  const sidebarCollapsed = useSelector(getSidbarCollapsed)
  const { showConfirmationDialog } = useNotification()
  // 新增 loading 状态
  const [isMenuLoaded, setIsMenuLoaded] = useState(false)

  useInitAuthEffect()

  useEffect(() => {
    if (user) {
      // console.log('ha suer', user)
      setIsMenuLoaded(false)

      dispatch(fetchMenuItems())
        .unwrap()
        .then(res => {
          // console.log('fech menu success', res)
          // setIsMenuLoaded(true)
        })
        .catch(err => {})
        .finally(() => {
          console.log('fetch menu finished.')
          setIsMenuLoaded(true)
        })
    } else {
      setIsMenuLoaded(true)
    }
  }, [dispatch, user])

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

  const memuItemKV: Record<string, SystemMenuItem> = useMemo(
    () =>
      menuItems.reduce(
        (pre, cur) => {
          pre[cur.key] = cur
          return pre
        },
        {} as Record<string, SystemMenuItem>,
      ),
    [menuItems],
  )

  const computeRolePermissions = useCallback(
    (route: RouteConfig) => {
      // const menuItem = menuItems.find(item => item.key === route.name)
      const menuItem = memuItemKV[route.name]
      if (!menuItem) return true
      const menuPermKeys = menuItem.permissions.filter(p => p !== '*')
      if (menuPermKeys.length === 0) return true

      // const menuPermIndexes = permissions.filter(item => menuPermKeys.includes(item.key)).map(item => item.index)
      const menuPervalues = menuPermKeys.map(item => permissionsKeyValue[item]).filter(item => item !== undefined)
      // const menuPermValue = calculateRoleValue(menuPermIndexes)
      const menuPermValue = calculateRoleValueFromValue(menuPervalues)
      const hasPer = hasPermissionByValue(totalPermissionsValue, menuPermValue)

      return hasPer
    },
    [memuItemKV, permissionsKeyValue, totalPermissionsValue],
  )

  const filterValidMenus = useCallback(
    (routes: RouteConfig[], parentPath = ''): MenuItem[] => {
      return routes.flatMap(route => {
        const { requiresAuth, path, isDesktop, name, hidden, children } = route
        const fullPath = `${parentPath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

        const hasPermission = computeRolePermissions(route)

        if (!hasPermission || hidden || (requiresAuth && !isAuthenticated) || (isDesktop && !isElectron())) {
          return []
        }
        // const { children, ...state } = route

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
  const filterUnAuthValidMenus = useCallback(
    (routes: RouteConfig[], parentPath = ''): MenuItem[] => {
      return routes.flatMap(route => {
        const { requiresAuth, path, isDesktop, name, hidden, children } = route
        const fullPath = `${parentPath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

        if (hidden || (isDesktop && !isElectron())) {
          return []
        }
        // const { children, ...state } = route

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
    [filterValidMenus],
  )

  const validMenuItems = useMemo(() => {
    // if (!isMenuLoaded || !canCheckPermission) return []
    // console.log('isMenuLoaded , canCheckPermission , user', isMenuLoaded, canCheckPermission, user)
    if (!isMenuLoaded || !canCheckPermission || !user) {
      const unAuthRoutes = getUnrequiresAuthRoutes()
      // console.log('unAuthRoutes: ', unAuthRoutes)
      return filterUnAuthValidMenus(unAuthRoutes)
    }
    // return []
    return filterValidMenus(authRoutes)
  }, [isMenuLoaded, canCheckPermission, user, filterValidMenus, filterUnAuthValidMenus])

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
          spinning={!isMenuLoaded && !!user}
          tip={<span style={{ textShadow: 'none' }}>Loading menu...</span>}
          className="flex justify-center  items-center  "
          style={{ height: '100vh' }}
        >
          {validMenuItems.length === 0 ? (
            <Empty description="No available menu" /> // 没有有效菜单项时的提示
          ) : (
            <Menu theme="dark" mode="inline" items={validMenuItems} />
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
