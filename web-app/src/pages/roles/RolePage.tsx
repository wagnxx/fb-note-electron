// src/pages/roles/RolePage.tsx

import React from 'react'
import {
  MenuConfigManagement,
  OrganizationRequestManagement,
  PermissionManagement,
  RolePermissionManagement,
  UserRoleManagement,
} from '@/features/rolePermission' // 引入 RoleManagement 组件
import { Tabs, type TabsProps } from 'antd'

const RolePage = () => {
  const tabsItems: TabsProps['items'] = [
    {
      key: 'Role',
      label: 'Role',
      children: <RolePermissionManagement />,
    },
    {
      key: 'Permission2',
      label: 'Permission',
      children: <PermissionManagement />,
    },
    {
      key: 'userRole',
      label: 'User Role',
      children: <UserRoleManagement />,
    },
    {
      key: 'orgReq',
      label: 'Org Request',
      children: <OrganizationRequestManagement />,
    },
    {
      key: 'menuConfig',
      label: 'Menu Config',
      children: <MenuConfigManagement />,
    },
  ]
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Access Control Center </h1>
      <Tabs defaultActiveKey="Role" items={tabsItems} destroyInactiveTabPane></Tabs>
    </div>
  )
}

export default RolePage
