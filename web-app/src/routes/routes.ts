// src/routes.ts
import React from 'react'
import NotFound from '@/pages/error/NotFound'
import GuidePage from '@/pages/home/GuidePage'
import MindMap from '@/pages/mindmap/MindMap'
import Login from '@/pages/login/Login'
import { routesTool } from './config/tool'
import { routesLearn } from './config/learn'
import { routesSystem } from './config/system'
import { routesTest } from './config/test'
import { routesRole } from './config/role'
import UserProfile from '@/pages/user/Profile'

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

  { path: '*', name: 'NotFound', component: NotFound, requiresAuth: true, hidden: true },
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
    path: 'tool/mindmap/local',
    name: 'MindMapLocal',
    component: MindMap,
  },
  // 其他独立页面路由
]
