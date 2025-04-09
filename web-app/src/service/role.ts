import {
  addDocToCol,
  deleteDocsByIds,
  getFieldValues,
  performFirestoreTransaction,
  TransactionOperation,
  updateDocData,
} from '@/firebase/db'
import { auth } from '@/firebase/authService'
import {
  MenuItem,
  OrganizationRequest,
  OrgItem,
  PermissionItem,
  RolePermission,
  UserRoleItem,
} from '@/features/rolePermission'
import { FieldValue, orderBy, serverTimestamp } from 'firebase/firestore'
import { Optional, PartialWithRequiredId } from '@/utils/types'

const COL_MENUITEMS = 'menuItems'
const COL_ORGS = 'organizations'
const COL_ORGANIZATION_REQUESTS = 'organizationRequests'
const COL_ORG_MEMBERS = 'orgMembers'
const COL_PERMISSIONS = 'permissions'
const COL_ROLE_PERMISSIONS = 'rolePermissions'

export const createPermissionAPI = async (item: PermissionItem) => {
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

export const fetchUserRolesAPI = async () => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  return getFieldValues<UserRoleItem>(COL_ORG_MEMBERS, 'all')
}
export const fetchOrgsAPI = async () => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  return getFieldValues<OrgItem>(COL_ORGS, 'all')
}

export const updateUserRoleAPI = async (item: Partial<UserRoleItem>) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }
  return updateDocData(COL_ORG_MEMBERS, item.id!, item)
}
export const deleteUserRoleAPI = (ids: string[]) => deleteDocsByIds(COL_ORG_MEMBERS, ids)

export const createOrganizationRequestsAPI = async (item: Optional<OrganizationRequest, 'id'>) => {
  // 模拟API请求
  return addDocToCol(COL_ORGANIZATION_REQUESTS, item)
}
export const fetchOrganizationRequestsAPI = async (): Promise<OrganizationRequest[]> => {
  // 模拟API请求
  return getFieldValues(COL_ORGANIZATION_REQUESTS, 'all')
}

export const approveRequestAPI = async (item: OrganizationRequest) => {
  // 模拟批准请求
  // return { id: requestId, status: 'approved' }
  const operations: TransactionOperation[] = [
    {
      colName: COL_ORG_MEMBERS,
      actionType: 'add',
      docData: {
        orgId: item.orgId,
        orgName: item.orgName,
        role: item.role,
        userId: item.userId,
        userName: item.userName,
      },
    },
    {
      colName: COL_ORGANIZATION_REQUESTS,
      actionType: 'update',
      docId: item.id,
      docData: { status: item.status },
    },
  ]

  return performFirestoreTransaction(operations)
}

export const rejectRequestAPI = async (requestId: string) => {
  return updateDocData(COL_ORGANIZATION_REQUESTS, requestId, { status: 'rejected' })
}

type MenuItemDocument = MenuItem & {
  createdAt: FieldValue
  updatedAt: FieldValue
  createdBy: string
  updatedBy?: string
}

export const fetchMenuItemsAPI = async (): Promise<MenuItemDocument[]> => {
  // 模拟API请求
  return getFieldValues(COL_MENUITEMS, 'all')
}

export const createMenuItemAPI = async (item: Optional<MenuItem, 'id'>) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }
  const doc: MenuItemDocument = { ...item } as MenuItemDocument
  doc.createdAt = serverTimestamp()
  doc.updatedAt = serverTimestamp()
  doc.createdBy = auth.currentUser.uid
  return addDocToCol(COL_MENUITEMS, doc)
}

export const updateMenuItemAPI = async (item: PartialWithRequiredId<MenuItem, 'id'>) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }
  const doc: Partial<MenuItemDocument> = { ...item }
  doc.updatedAt = serverTimestamp()
  doc.updatedBy = auth.currentUser.uid
  return updateDocData(COL_MENUITEMS, item.id, doc)
}

export const deleteMenuItemAPI = async (ids: string[]) => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }

  return deleteDocsByIds(COL_MENUITEMS, ids)
}
