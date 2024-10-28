// src/routes.ts
import React from 'react'
import HomePage from '@/pges/home/Home'
import NotFound from '@/pges/error/NotFound'
import GuidePage from '@/pges/home/GuidePage'
import Dict from '@/pges/dict/Dict'

interface RouteConfig {
  path: string
  name: string
  component: React.ComponentType<any>
  requiresAuth: boolean
  hidden?: boolean
}

const routes: RouteConfig[] = [
  { path: '/', name: 'GuidePage', component: GuidePage, requiresAuth: false, hidden: true },
  { path: '/system', name: 'Home', component: HomePage, requiresAuth: false },
  { path: '/dict', name: 'Dict', component: Dict, requiresAuth: true },
  { path: '*', name: 'NotFound', component: NotFound, requiresAuth: true, hidden: true },
]

export default routes
