// src/features/rolePermissionManagement/types.ts

export interface PermissionItem {
  id?: string
  key: string
  index: number
  value: number
  desc_en: string
  desc_zh: string
}

export interface RolePermission {
  id: string
  role: string
  permissions: string[] // 可为权限 key 或 "*" 表示全权限
}

export interface RolePermissionState {
  permissions: PermissionItem[]
  rolePermissions: RolePermission[]
  loading: boolean
}
