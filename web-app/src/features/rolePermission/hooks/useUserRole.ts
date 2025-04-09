import { useEffect, useMemo, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchUserRoles, fetchPermissions, fetchRolePermissions } from '../rolePermissionSlice'
import { UserRoleItem } from '../types'

interface RoleWithValue {
  role: string[] | string
  permissionIndexes: number[] // 使用权限的索引列表代替权限值
}

const defaultRole: UserRoleItem = {
  id: '_',
  userId: '_',
  userName: '_',
  orgName: '_',
  role: 'guest',
}

const useUserRole = () => {
  const dispatch = useAppDispatch()

  // 获取当前用户的角色信息以及权限
  const { rolePermissions, userRoles, permissions } = useAppSelector(state => state.rolePermission)
  const user = useAppSelector(state => state.auth.user)

  const [userRoleWithPermissions, setUserRoleWithPermissions] = useState<RoleWithValue[]>([])

  // 筛选当前用户加入的组织
  const joindOrgs = useMemo(
    () => userRoles.filter(item => item.userId === user?.uid) || [defaultRole],
    [user?.uid, userRoles],
  )

  useEffect(() => {
    if (user) {
      // 假设你通过一个API获取用户角色，调用dispatch请求
      dispatch(fetchRolePermissions(''))
      dispatch(fetchUserRoles())
      dispatch(fetchPermissions())
    }
  }, [dispatch, user])

  useEffect(() => {
    const calculateRoleWithPermissions = () => {
      // 如果有用户角色，从 userRoles 中找出当前角色
      const roleWithPermissions = joindOrgs.map((userRole: UserRoleItem) => {
        const rolePerm = rolePermissions.find(item => item.role === userRole.role)
        if (!rolePerm) {
          return {
            role: userRole.role,
            permissionIndexes: [], // 没有角色时，默认没有权限
          }
        }

        const permssionKeys = rolePerm.permissions
        let userPermissionIndexes: number[]
        if (permssionKeys.includes('*')) {
          // 如果角色包含 '*'，则返回所有权限的索引
          userPermissionIndexes = permissions.map(item => item.index)
        } else {
          // 否则，根据角色的权限列表来过滤权限的索引
          userPermissionIndexes = permissions.filter(item => permssionKeys.includes(item.key)).map(item => item.index)
        }

        // 返回包含角色和权限索引
        return {
          role: userRole.role,
          permissionIndexes: userPermissionIndexes,
        }
      })

      // 将角色和权限索引存入状态
      setUserRoleWithPermissions(roleWithPermissions)
    }

    calculateRoleWithPermissions()
  }, [joindOrgs, permissions, rolePermissions])

  // 计算所有角色的综合权限值
  const totalPermissionsValue = userRoleWithPermissions.reduce((totalValue, role) => {
    return totalValue | calculateRoleValue(role.permissionIndexes)
  }, 0n) // 0n 是 BigInt 的初始化值

  return { userRoleWithPermissions, totalPermissionsValue }
}

export default useUserRole

// 计算角色的综合权限值
export const calculateRoleValue = (permissionIndexes: number[]): bigint => {
  return permissionIndexes.reduce((totalValue, index) => {
    return totalValue | (2n ** BigInt(index))
  }, 0n)
}
