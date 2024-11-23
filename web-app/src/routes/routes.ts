// src/routes.ts
import React from 'react'
import NotFound from '@/pges/error/NotFound'
import GuidePage from '@/pges/home/GuidePage'
import MindMapPage from '@/pges/mindmap/MindMapPage'
import Login from '@/pges/login/Login'
import { routesTool } from './config/tool'
import { routesLearn } from './config/learn'
import { routesSystem } from './config/system'

export interface RouteConfig {
  path: string
  name: string
  component: React.ComponentType<any>
  requiresAuth?: boolean
  hidden?: boolean
  isStandalone?: boolean
  children?: RouteConfig[]
}

export const authRoutes: RouteConfig[] = [
  routesSystem,
  routesLearn,
  routesTool,

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
