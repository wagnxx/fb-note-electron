import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchUserRoles, fetchPermissions, fetchRolePermissions } from '../slices/rolePermissionSlice'
import { UserRoleItem } from '../types'
import { calculateRoleValueFromValue } from '../utils/roleValue'

type RoleWithValue = {
  role: string[] | string
  permissions: { key: string; value: bigint }[]
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

  const { rolePermissions, userRoles, permissionsKeyValue } = useAppSelector(state => state.rolePermission)
  const user = useAppSelector(state => state.auth.user)

  const [userRoleWithPermissions, setUserRoleWithPermissions] = useState<RoleWithValue[]>([])
  const [canCheckPermission, setCanCheckPermission] = useState(false)

  const joindOrgs = useMemo(
    () => userRoles.filter(item => item.userId === user?.uid) || [defaultRole],
    [user?.uid, userRoles],
  )

  useEffect(() => {
    if (user) {
      dispatch(fetchRolePermissions(''))
      dispatch(fetchUserRoles())
      dispatch(fetchPermissions())
    }
  }, [dispatch, user])

  useEffect(() => {
    const calculateRoleWithPermissions = () => {
      const roleWithPermissions = joindOrgs.map((userRole: UserRoleItem) => {
        const rolePerm = rolePermissions.find(item => item.role === userRole.role)
        if (!rolePerm) {
          setCanCheckPermission(false)
          return {
            role: userRole.role,
            permissions: [],
          }
        }

        const permssionKeys = rolePerm.permissions

        let permissionsKV: RoleWithValue['permissions'] = []
        if (permssionKeys.includes('*')) {
          permissionsKV = Object.entries(permissionsKeyValue).map(([key, value]) => ({ key, value }))
        } else {
          permissionsKV = permssionKeys.map(key => ({ key, value: permissionsKeyValue[key] }))
        }

        return {
          role: userRole.role,
          permissions: permissionsKV,
        }
      })

      setUserRoleWithPermissions(roleWithPermissions)
    }

    calculateRoleWithPermissions()

    if (Object.keys(permissionsKeyValue).length) {
      setCanCheckPermission(true)
    }
  }, [joindOrgs, permissionsKeyValue, rolePermissions])

  const totalPermissionsValue = userRoleWithPermissions.reduce((totalValue, role) => {
    return totalValue | calculateRoleValueFromValue(role.permissions.map(item => item.value))
  }, 0n)

  /**
   * 检查用户是否拥有指定权限 key
   */
  const isPermitted = useCallback(
    (key: string): boolean => {
      if (!canCheckPermission) return false
      const value = permissionsKeyValue[key]
      if (value === undefined) {
        console.warn(`[Permission] Unknown permission key: "${key}"`)
        return false
      }
      return (totalPermissionsValue & value) !== 0n
    },
    [canCheckPermission, permissionsKeyValue, totalPermissionsValue],
  )

  return {
    userRoleWithPermissions,
    totalPermissionsValue,
    isPermitted, // ✅ 导出 check 方法
  }
}

export default useUserRole
