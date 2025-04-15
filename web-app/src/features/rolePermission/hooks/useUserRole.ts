import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchUserRoles, fetchPermissions, fetchRolePermissions } from '../slices/rolePermissionSlice'
import { PermissionItem, RolePermission, UserRoleItem } from '../types'
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
  const permissionsKeyValue = useAppSelector(state => state.rolePermission.permissionsKeyValue)

  const { user } = useAppSelector(state => state.auth)

  const [userRoleWithPermissions, setUserRoleWithPermissions] = useState<RoleWithValue[]>([])
  const [canCheckPermission, setCanCheckPermission] = useState(false)
  const hasFetchedRef = useRef(false)

  const calculateRoleWithPermissions = useCallback(
    (rolePermissions: RolePermission[], userRoles: UserRoleItem[], permissions: PermissionItem[]) => {
      const joindOrgs = userRoles.filter(item => item.userId === user?.uid) || [defaultRole]
      const _permissionsKeyValue: Record<string, bigint> = permissions.reduce(
        (acc, cur, index) => {
          acc[cur.key] = 1n << BigInt(index) // 或者是 2n ** BigInt(index)
          return acc
        },
        {} as Record<string, bigint>,
      )

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
          permissionsKV = Object.entries(_permissionsKeyValue).map(([key, value]) => ({ key, value }))
        } else {
          permissionsKV = permssionKeys.map(key => ({ key, value: _permissionsKeyValue[key] }))
        }

        return {
          role: userRole.role,
          permissions: permissionsKV,
        }
      })

      setUserRoleWithPermissions(() => {
        return roleWithPermissions
      })

      setCanCheckPermission(true)
    },
    [user?.uid],
  )

  const totalPermissionsValue = useMemo(
    () =>
      userRoleWithPermissions.reduce((totalValue, role) => {
        return totalValue | calculateRoleValueFromValue(role.permissions.map(item => item.value))
      }, 0n),
    [userRoleWithPermissions],
  )

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

  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      Promise.all([
        dispatch(fetchRolePermissions('')).unwrap(),
        dispatch(fetchUserRoles()).unwrap(),
        dispatch(fetchPermissions()).unwrap(),
      ])
        .then(([rolePermissions, userRoles, permissions]) => {
          console.log(' PRomise all success')
          hasFetchedRef.current = true
          calculateRoleWithPermissions(rolePermissions, userRoles, permissions)
        })
        .catch(err => {
          console.log('promse all err: ', err)
          hasFetchedRef.current = false
        })
    }
  }, [dispatch, user, calculateRoleWithPermissions])

  return {
    userRoleWithPermissions,
    totalPermissionsValue,
    isPermitted, // ✅ 导出 check 方法
    canCheckPermission,
    permissionsKeyValue,
  }
}

export default useUserRole
