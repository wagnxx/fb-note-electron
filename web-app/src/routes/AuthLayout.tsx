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
import { DEFAULT_LOCAL_USER_TYPE, LocalUserType } from '@/features/preferences/userType'

const { Content, Sider } = Layout
const { ipcRenderer, IPC_ACTIONS } = (window as any).electron || {}

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
  const [localUserType, setLocalUserType] = useState<LocalUserType>(DEFAULT_LOCAL_USER_TYPE)

  useInitAuthEffect()

  useEffect(() => {
    let mounted = true
    const loadLocalPreference = async () => {
      if (!ipcRenderer) return
      try {
        const cfg = await ipcRenderer.invoke(IPC_ACTIONS.GET_APP_SETTINGS)
        if (!mounted) return
        setLocalUserType((cfg?.userPreference?.userType as LocalUserType) || DEFAULT_LOCAL_USER_TYPE)
      } catch {
        // ignore
      }
    }
    loadLocalPreference()
    return () => {
      mounted = false
    }
  }, [])

  const matchLocalUserType = useCallback(
    (fullPath: string) => {
      if (localUserType === 'developer') return true
      if (fullPath.startsWith('/settings') || fullPath.startsWith('/system')) return true
      if (localUserType === 'writer') {
        return fullPath.startsWith('/tool/writing') || fullPath === '/tool' || fullPath === '/'
      }
      if (localUserType === 'relay') {
        return fullPath.startsWith('/tool/relay') || fullPath === '/tool' || fullPath === '/'
      }
      // toolUser
      return fullPath.startsWith('/tool') || fullPath === '/'
    },
    [localUserType],
  )

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

        if (!matchLocalUserType(fullPath)) {
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

        if (children && (!menuItem.children || menuItem.children.length === 0)) {
          return []
        }

        return [menuItem]
      })
    },
    [computeRolePermissions, isAuthenticated, matchLocalUserType],
  )
  const filterUnAuthValidMenus = useCallback(
    (routes: RouteConfig[], parentPath = ''): MenuItem[] => {
      return routes.flatMap(route => {
        const { requiresAuth, path, isDesktop, name, hidden, children } = route
        const fullPath = `${parentPath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

        if (hidden || (isDesktop && !isElectron())) {
          return []
        }

        if (!matchLocalUserType(fullPath)) {
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

        if (children && (!menuItem.children || menuItem.children.length === 0)) {
          return []
        }

        return [menuItem]
      })
    },
    [filterValidMenus, matchLocalUserType],
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
      <Sider width={220} trigger={null} collapsedWidth={56} collapsible collapsed={sidebarCollapsed}>
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
        <div className="h-[calc(100vh-28px)] flex flex-col">
          <Spin
            spinning={!isMenuLoaded && !!user}
            tip={<span style={{ textShadow: 'none' }}>Loading menu...</span>}
            className="flex justify-center items-center flex-1 overflow-auto"
          >
            {validMenuItems.length === 0 ? (
              <Empty description="No available menu" />
            ) : (
              <Menu theme="dark" mode="inline" inlineCollapsed={sidebarCollapsed} items={validMenuItems} />
            )}
          </Spin>
        </div>
      </Sider>
      <Content style={{ padding: '0px', height: 'calc(100vh - 28px)', overflow: 'auto' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default AuthLayout
