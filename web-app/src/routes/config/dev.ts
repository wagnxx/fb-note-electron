import PerformanceLabPage from '@/pages/test/PerformanceLabPage'
import { RouteConfig } from '../routes'
import ParentEmpty from '@/components/layout/ParentEmpty'
import TestPage from '@/pages/test/Test'

export const routesDev: RouteConfig = {
  // path: '/test',
  // name: 'TestPage',
  // component: TestPage,
  // requiresAuth: true,
  path: '/dev',
  name: 'Dev Lab',
  component: ParentEmpty,
  children: [
    { path: 'flow', name: 'Flow', component: TestPage },
    { path: 'performance', name: 'Performance', component: PerformanceLabPage },
  ],
}
