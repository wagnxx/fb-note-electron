// src/routes.ts
import React from 'react'
import HomePage from '@/pges/home/Home'
import NotFound from '@/pges/error/NotFound'
import GuidePage from '@/pges/home/GuidePage'
import Dict from '@/pges/dict/Dict'
import DictRoot from '@/pges/dict/DictRoot'
import ParentEmpty from '@/components/layout/ParentEmpty'

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
  {
    path: '/',
    name: 'GuidePage',
    component: GuidePage,
    requiresAuth: false,
    hidden: true,
    isStandalone: true,
  },
  { path: '/system', name: 'Home', component: HomePage, requiresAuth: false },

  {
    path: '/dict',
    name: 'Dict',
    component: ParentEmpty,
    children: [
      {
        path: 'dict',
        name: 'dict',
        component: Dict,
      },
      {
        path: 'dict-root',
        name: 'DictRoot',
        component: DictRoot,
      },
    ],
  },

  { path: '*', name: 'NotFound', component: NotFound, requiresAuth: true, hidden: true },
]

export const standaloneRoutes: RouteConfig[] = [
  {
    path: '/',
    name: 'guide',
    component: GuidePage,
  },
  // 其他独立页面路由
]
