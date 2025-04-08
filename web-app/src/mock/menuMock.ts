import { MenuItem } from '@/features/rolePermission/types/'

export const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    parentId: null,
    label: 'Dashboard',
    key: '/dashboard',
    permissions: ['view_dashboard'],
    order: 0,
  },
  {
    id: '2',
    parentId: null,
    label: 'User Management',
    key: '/users',
    permissions: ['manage_users'],
    order: 0,
  },
  {
    id: '3',
    parentId: '2',
    label: 'User List',
    key: '/users/list',
    permissions: ['read_users'],
    order: 0,
  },
  {
    id: '4',
    parentId: '2',
    label: 'Add User',
    key: '/users/add',
    permissions: ['create_user'],
    order: 0,
  },
  {
    id: '5',
    parentId: null,
    label: 'Settings',
    key: '/settings',
    permissions: ['view_settings'],
    order: 0,
  },
]

// export const mockPermissions: PermissionItem[] = [
//   {
//     key: 'view_dashboard',
//     value: true,
//     desc_en: 'View dashboard',
//     desc_zh: '查看仪表盘',
//   },
//   {
//     key: 'manage_users',
//     value: true,
//     desc_en: 'Manage users',
//     desc_zh: '管理用户',
//   },
//   {
//     key: 'read_users',
//     value: true,
//     desc_en: 'Read user list',
//     desc_zh: '读取用户列表',
//   },
//   {
//     key: 'create_user',
//     value: true,
//     desc_en: 'Create new user',
//     desc_zh: '创建新用户',
//   },
//   {
//     key: 'view_settings',
//     value: true,
//     desc_en: 'View settings',
//     desc_zh: '查看设置',
//   },
// ]
