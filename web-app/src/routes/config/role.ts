import RolePage from '@/pages/roles/RolePage'
import { RouteConfig } from '../routes'

export const routesRole: RouteConfig = {
  path: '/role',
  name: 'Role',
  component: RolePage,
  requiresAuth: true,
}
