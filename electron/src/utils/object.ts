/**
 * 返回一个新对象，移除了指定无效值（如 undefined、null、''）
 *
 * @param obj 原始对象
 * @param options 配置项
 *  - removeNull: 是否移除 null（默认 false）
 *  - removeEmptyString: 是否移除空字符串 ''（默认 false）
 */
export function getValidObject<T extends Record<string, any>>(
  obj: T,
  options?: {
    removeNull?: boolean
    removeEmptyString?: boolean
  },
): Partial<T> {
  const { removeNull = false, removeEmptyString = false } = options || {}

  const result: Partial<T> = {}

  for (const key of Object.keys(obj) as Array<keyof T>) {
    const value = obj[key]

    const isUndefined = value === undefined
    const isNull = value === null
    const isEmptyString = typeof value === 'string' && value.trim() === ''

    if (isUndefined || (removeNull && isNull) || (removeEmptyString && isEmptyString)) {
      continue
    }

    result[key] = value
  }

  return result
}
