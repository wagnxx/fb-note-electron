// roleValue.ts

/**
 * 根据权限索引列表计算权限值（BigInt）
 * @param permissionIndexes 权限对应的 index 数组
 * @returns 权限值（BigInt）
 */
export const calculateRoleValue = (permissionIndexes: number | number[]): bigint => {
  if (!Array.isArray(permissionIndexes)) {
    permissionIndexes = [permissionIndexes]
  }
  return permissionIndexes.reduce((total, index) => {
    return total | (1n << BigInt(index))
  }, 0n)
}

export const calculateRoleValueFromValue = (permissionValues: bigint[]): bigint => {
  return permissionValues.reduce((totalValue, value) => {
    return totalValue | value // 使用位运算计算角色值
  }, 0n)
}

/**
 * 判断某个权限值是否包含指定权限索引
 * @param roleValue 当前角色的权限值（BigInt）
 * @param permissionIndex 权限的 index 值
 * @returns 是否包含该权限
 */
export const hasPermissionByIndex = (roleValue: bigint, permissionIndex: number): boolean => {
  return (roleValue & (1n << BigInt(permissionIndex))) !== 0n
}
export const hasPermissionByValue = (roleValue: bigint, permissionValue: bigint): boolean => {
  return (roleValue & permissionValue) !== 0n
}

/**
 * 将权限值反向解析为 index 列表（用于显示）
 * @param roleValue 权限值
 * @returns 包含的权限 index 数组
 */
export const extractPermissionIndexes = (roleValue: bigint): number[] => {
  const result: number[] = []
  for (let i = 0n; i < 256n; i++) {
    if ((roleValue & (1n << i)) !== 0n) {
      result.push(Number(i))
    }
  }
  return result
}
