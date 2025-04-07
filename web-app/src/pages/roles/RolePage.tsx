// src/pages/roles/RolePage.tsx

import React from 'react'
import { PermissionManagement, RolePermissionManagement } from '@/features/rolePermission' // 引入 RoleManagement 组件
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
  ]
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Access Control Center </h1>
      <Tabs defaultActiveKey="Role" items={tabsItems} destroyInactiveTabPane></Tabs>
    </div>
  )
}

export default RolePage
