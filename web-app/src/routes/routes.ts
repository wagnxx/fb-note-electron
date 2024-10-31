// src/routes.ts
import React from 'react'
import HomePage from '@/pges/home/Home'
import NotFound from '@/pges/error/NotFound'
import GuidePage from '@/pges/home/GuidePage'
import Dict from '@/pges/dict/Dict'
import WordRoot from '@/pges/dict/WordRoot'
import WordAffix from '@/pges/dict/WordAffix'
import ParentEmpty from '@/components/layout/ParentEmpty'
import MindMapPage from '@/pges/mindmap/MindMapPage'
import MindMapManagePage from '@/pges/mindmap/MindMapManagePage'

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
    path: '/learn',
    name: 'Dict',
    component: ParentEmpty,
    children: [
      {
        path: 'dict',
        name: 'dict',
        component: Dict,
      },
      {
        path: 'word-root',
        name: 'WordRoot',
        component: WordRoot,
      },
      {
        path: 'word-affix',
        name: 'WordAffix',
        component: WordAffix,
      },
    ],
  },
  {
    path: '/tool',
    name: 'Tool',
    component: ParentEmpty,
    children: [
      {
        path: 'mindmapManage',
        name: 'mindMapManagePage',
        component: MindMapManagePage,
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
  {
    path: 'tool/mindmap',
    name: 'MindMapPage',
    component: MindMapPage,
  },
  // 其他独立页面路由
]
