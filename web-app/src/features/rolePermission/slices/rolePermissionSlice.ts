import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { RolePermissionState } from '../types'
import {
  fetchPermissionsFromAPI,
  fetchRolePermissionFromAPI,
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
  createPermissionAPI,
  batchUpdatePermissionAPI,
} from '@/service/role'

const initialState: RolePermissionState = {
  permissions: [],
  permissionsKeyValue: {},
  rolePermissions: [],
  loading: false,
  userRoles: [],
  organizationRequests: [],
  orgs: [],
  menuItems: [],
}

export const fetchPermissions = createAsyncThunk('rolePermission/fetchPermissions', fetchPermissionsFromAPI)
export const fetchRolePermissions = createAsyncThunk('rolePermission/fetchRolePermissions', (orgId?: string) =>
  fetchRolePermissionFromAPI(),
)
export const createRole = createAsyncThunk('rolePermission/createRole', addRolePermissionAPI)
export const modifyRole = createAsyncThunk('rolePermission/modifyRole', updateRolePermissionAPI)
export const removeRole = createAsyncThunk('rolePermission/removeRole', deleteRolePermissionAPI)

export const addPermission = createAsyncThunk('rolePermission/addPermission', createPermissionAPI)
export const updatePermission = createAsyncThunk('rolePermission/updatePermission', updatePermissionAPI)
export const batchUpdatePermission = createAsyncThunk('rolePermission/updatePermission', batchUpdatePermissionAPI)
export const deletePermission = createAsyncThunk('rolePermission/deletePermission', deletePermissionAPI)

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
        const permissions = action.payload
        state.permissions = permissions
        // 计算 key-value 映射
        const permissionsKeyValue: Record<string, bigint> = permissions.reduce(
          (acc, cur, index) => {
            acc[cur.key] = 1n << BigInt(index) // 或者是 2n ** BigInt(index)
            return acc
          },
          {} as Record<string, bigint>,
        )

        state.permissionsKeyValue = permissionsKeyValue
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        state.rolePermissions = action.payload
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
