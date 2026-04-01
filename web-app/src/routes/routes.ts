// src/routes.ts
import React from 'react'
import GuidePage from '@/pages/home/GuidePage'
import MindMap from '@/pages/mindmap/MindMap'
import Login from '@/pages/login/Login'
import UserProfile from '@/pages/user/Profile'
import { routesTool } from './config/tool'
import { routesLearn } from './config/learn'
import { routesSystem } from './config/system'
import { routesTest } from './config/test'
import { routesRole } from './config/role'
import ChatRoomWeb from '@/pages/tools/chat/web'
import RelayWebConnectPage from '@/pages/tools/relay/web'
import SettingsPage from '@/pages/settings/SettingsPage'

export interface RouteConfig {
  path: string
  name: string
  component: React.ComponentType<any>
  requiresAuth?: boolean
  hidden?: boolean
  isStandalone?: boolean
  isDesktop?: boolean
  children?: RouteConfig[]
}

export const authRoutes: RouteConfig[] = [
  routesSystem,
  routesLearn,
  routesTool,
  routesTest,
  routesRole,

  // Note: 404 route has been moved to the root level routes configuration
  // to ensure it catches all unmatched paths correctly
]

export const standaloneRoutes: RouteConfig[] = [
  {
    path: '/',
    name: 'guide',
    component: GuidePage,
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/userProfile',
    name: 'userProfile',
    component: UserProfile,
    // requiresAuth: true,
    hidden: true,
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
    requiresAuth: false,
  },
  {
    path: 'tool/mindmap/local',
    name: 'MindMapLocal',
    component: MindMap,
  },
  {
    path: '/tool/chat/web/',
    name: 'ChatRoomWeb',
    component: ChatRoomWeb,
    requiresAuth: false,
  },
  {
    path: '/tool/relay/web/',
    name: 'RelayWebConnect',
    component: RelayWebConnectPage,
    requiresAuth: false,
  },
  // 其他独立页面路由
]

export const getUnrequiresAuthRoutes = () => {
  const filter = (route: RouteConfig) => {
    if (route.children?.length) {
      route.children = route.children.filter(filter)
    }
    return !route.requiresAuth
  }
  return authRoutes.filter(filter)
}
