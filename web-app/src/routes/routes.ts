// src/routes.ts
import React from 'react'
import NotFound from '@/pages/error/NotFound'
import GuidePage from '@/pages/home/GuidePage'
import MindMapPage from '@/pages/mindmap/MindMapPage'
import Login from '@/pages/login/Login'
import { routesTool } from './config/tool'
import { routesLearn } from './config/learn'
import { routesSystem } from './config/system'
import { routesTest } from './config/test'

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
    path: 'tool/mindmap',
    name: 'MindMapPage',
    component: MindMapPage,
  },
  // 其他独立页面路由
]
