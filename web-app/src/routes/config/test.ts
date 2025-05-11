import TestPage from '@/pages/test/Test'
import { RouteConfig } from '../routes'

export const routesTest: RouteConfig = {
  path: '/test',
  name: 'TestPage',
  component: TestPage,
  requiresAuth: true,
}
