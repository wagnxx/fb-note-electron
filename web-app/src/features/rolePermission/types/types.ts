// src/features/rolePermissionManagement/types.ts

import { SystemMenuItem as MenuItem } from './menuTypes'

export interface PermissionItem {
  id?: string
  key: string
  index: number
  /**
   * @deprecated replaced by `index`
   * This field is no longer used in permission calculations.
   * Will be removed in future versions.
   */
  value: number
  desc_en: string
  desc_zh: string
}

export interface RolePermission {
  id: string
  role: string
  permissions: string[] // 可为权限 key 或 "*" 表示全权限
}

export interface UserRoleItem {
  id: string
  userId: string
  userName?: string
  orgName: string
  role: string
}
export type OrgMember = {
  id?: string
  orgId: string
  orgName: string
  photoURL?: string | null
  role: string
  userId: string
  userName: string
}

export type OrganizationRequest = {
  id: string // request row id
  orgName: string
  orgId: string
  status: 'pending' | 'approved' | 'rejected'
} & OrgMember
export interface OrgItem {
  id: string
  name: string
}

export interface RolePermissionState {
  permissions: PermissionItem[]
  permissionsKeyValue: Record<string, bigint>
  rolePermissions: RolePermission[]
  userRoles: UserRoleItem[]
  organizationRequests: OrganizationRequest[] // 添加组织申请请求类型
  orgs: OrgItem[]
  menuItems: MenuItem[]
  loading: boolean
}
