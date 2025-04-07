import { addDocToCol, deleteDocsByIds, getFieldValues, updateDocData } from '@/firebase/db'
import { auth } from '@/firebase/authService'
import { PermissionItem, RolePermission } from '@/features/rolePermission'
import { orderBy } from 'firebase/firestore'

const COL_PERMISSIONS = 'permissions'
const COL_ROLE_PERMISSIONS = 'rolePermissions'

export const addPermissionAPI = async (item: PermissionItem) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  return addDocToCol(COL_PERMISSIONS, item)
}
export const updatePermissionAPI = async (item: Partial<PermissionItem>) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }
  return updateDocData(COL_PERMISSIONS, item.id!, item)
}
export const fetchPermissionsFromAPI = async () => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  return getFieldValues<PermissionItem>(COL_PERMISSIONS, 'all', [orderBy('index', 'asc')])
}
export const fetchRolePermissionFromAPI = async () => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  return getFieldValues<RolePermission>(COL_ROLE_PERMISSIONS, 'all', [orderBy('role', 'asc')])
}

export const deletePermissionAPI = (ids: string[]) => deleteDocsByIds(COL_PERMISSIONS, ids)

export const addRolePermissionAPI = async (item: RolePermission) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  return addDocToCol(COL_ROLE_PERMISSIONS, item)
}
export const updateRolePermissionAPI = async (item: Partial<RolePermission>) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }
  return updateDocData(COL_ROLE_PERMISSIONS, item.id!, item)
}
export const deleteRolePermissionAPI = (ids: string[]) => deleteDocsByIds(COL_ROLE_PERMISSIONS, ids)
