import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { PermissionItem, RolePermissionState } from './types'
import {
  fetchPermissionsFromAPI,
  fetchRolePermissionFromAPI,
  addPermissionAPI,
  updatePermissionAPI,
  deletePermissionAPI,
  addRolePermissionAPI,
  updateRolePermissionAPI,
  deleteRolePermissionAPI,
  fetchUserRolesAPI,
  updateUserRoleAPI,
  fetchOrganizationRequestsAPI,
  approveRequestAPI,
  rejectRequestAPI,
  fetchOrgsAPI,
  createOrganizationRequestsAPI,
  deleteUserRoleAPI,
  fetchMenuItemsAPI,
  createMenuItemAPI,
  updateMenuItemAPI,
  deleteMenuItemAPI,
} from '@/service/role'

const initialState: RolePermissionState = {
  permissions: [],
  rolePermissions: [],
  loading: false,
  userRoles: [],
  organizationRequests: [],
  orgs: [],
  menuItems: [],
}

export const fetchPermissions = createAsyncThunk('rolePermission/fetchPermissions', fetchPermissionsFromAPI)
export const fetchRolePermissions = createAsyncThunk('rolePermission/fetchRolePermissions', (orgId: string) =>
  fetchRolePermissionFromAPI(),
)
export const createRole = createAsyncThunk('rolePermission/createRole', addRolePermissionAPI)
export const modifyRole = createAsyncThunk('rolePermission/modifyRole', updateRolePermissionAPI)
export const removeRole = createAsyncThunk('rolePermission/removeRole', deleteRolePermissionAPI)

export const addPermission = createAsyncThunk('rolePermission/addPermission', async (item: PermissionItem) => {
  item.value = 1 << Number(item.index)
  const res = await addPermissionAPI(item)
  if (res) {
    return { ...item, id: res }
  }
  return item
})
export const updatePermission = createAsyncThunk('rolePermission/updatePermission', async (item: PermissionItem) => {
  if (item.index || item.index === 0) {
    item.index = Number(item.index)
    item.value = 1 << Number(item.index)
  }

  const res = await updatePermissionAPI(item)
  if (res) {
    return item
  }
})
export const deletePermission = createAsyncThunk('rolePermission/deletePermission', async (item: PermissionItem) => {
  if (!item.id) {
    return {
      res: true,
      item,
    }
  }
  const res = await deletePermissionAPI([item.id])
  return {
    item,
    res,
  }
})

export const fetchUserRoles = createAsyncThunk('rolePermission/fetchUserRoles', fetchUserRolesAPI)
export const updateUserRole = createAsyncThunk('rolePermission/updateUserRole', updateUserRoleAPI)
export const deleteUserRole = createAsyncThunk('rolePermission/deleteUserRole', deleteUserRoleAPI)

// 新增组织申请的异步操作
export const fetchOrganizationRequests = createAsyncThunk(
  'rolePermission/fetchOrganizationRequests',
  fetchOrganizationRequestsAPI,
)

export const approveRequest = createAsyncThunk('rolePermission/approveRequest', approveRequestAPI)
export const rejectRequest = createAsyncThunk('rolePermission/rejectRequest', rejectRequestAPI)
export const fetchOrgs = createAsyncThunk('rolePermission/fetchOrgs', fetchOrgsAPI)

export const createOrganizationRequest = createAsyncThunk('organization/createRequest', createOrganizationRequestsAPI)

// 请求菜单数据
export const fetchMenuItems = createAsyncThunk('rolePermission/fetchMenuItems', fetchMenuItemsAPI)

// 添加菜单项
export const addMenuItem = createAsyncThunk('rolePermission/addMenuItem', createMenuItemAPI)
// 非常语义清晰

// 更新菜单项
export const updateMenuItem = createAsyncThunk('rolePermission/updateMenuItem', updateMenuItemAPI)

// 删除菜单项
export const deleteMenuItem = createAsyncThunk('rolePermission/deleteMenuItem', deleteMenuItemAPI)

const rolePermissionSlice = createSlice({
  name: 'rolePermission',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        state.rolePermissions = action.payload
      })
      .addCase(addPermission.fulfilled, (state, action) => {
        state.permissions.push(action.payload)
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        if (action.payload.res) {
          const deletedKey = action.payload.item.key
          state.permissions = state.permissions.filter(p => p.key !== deletedKey)
        }
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        const updated = action.payload
        if (!updated?.key) return
        const index = state.permissions.findIndex(p => p.key === updated.key)
        if (index !== -1) {
          state.permissions[index] = updated
        }
      })
      .addCase(fetchUserRoles.fulfilled, (state, action) => {
        state.userRoles = action.payload
      })
      // 新增组织申请的处理
      .addCase(fetchOrganizationRequests.fulfilled, (state, action) => {
        state.organizationRequests = action.payload
      })
      .addCase(fetchOrgs.fulfilled, (state, action) => {
        console.log('fetch orgs :', action.payload)
        state.orgs = action.payload
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.menuItems = action.payload
      })
  },
})

export default rolePermissionSlice.reducer
