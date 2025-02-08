type Item = {
  key: string
  children?: Item[]
  [k: string]: any
}

export const findItemFromArrayByKey = (items: Item[], key: string): Item | null => {
  for (const item of items) {
    if (item.key === key) {
      return item
    }
    if (item.children) {
      const found = findItemFromArrayByKey(item.children, key)
      if (found) return found
    }
  }
  return null
}
export const calculateMiddleValue: (numbers: number[], referenceValue: number, interval: number) => number = (
  numbers: number[],
  referenceValue: number,
  interval: number = 100,
) => {
  // 如果数组为空，返回基准值
  if (numbers.length === 0) {
    return referenceValue
  }

  // 如果数组只有一个数字，返回该数字减去间隔值
  if (numbers.length === 1) {
    return numbers[0] - interval
  }

  // 对数组进行排序
  const sortedNumbers = [...numbers].sort((a, b) => a - b)

  let found = false
  let num1: number | null = null
  let num2: number | null = null

  // 遍历排序后的数组，寻找相邻的两个数
  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    // 检查相邻数之间的差值是否大于2倍的间隔值
    if (Math.abs(sortedNumbers[i] - sortedNumbers[i + 1]) > interval * 2) {
      num1 = sortedNumbers[i]
      num2 = sortedNumbers[i + 1]
      found = true
      break // 找到一对就退出循环
    }
  }

  // 如果找到合理的两个数字，返回它们的中间值
  if (found && num1 !== null && num2 !== null) {
    return (num1 + num2) / 2
  }

  // 如果找不到这样的数字，使用数组的第一位和最后一位
  const first = sortedNumbers[0]
  const last = sortedNumbers[sortedNumbers.length - 1]

  // 判断哪个数字离基准值近，进行相应的返回
  if (Math.abs(first - referenceValue) < Math.abs(last - referenceValue)) {
    return first - interval // 第一位离基准值近，返回 first - interval
  } else {
    return last + interval // 最后一位离基准值近，返回 last + interval
  }
}

export function mapByField<T>(array: T[], key: keyof T): Record<string, T> {
  return array.reduce(
    (result, currentValue) => {
      // 获取当前项的 key 值
      const groupKey = currentValue[key] as unknown as string

      // 将当前项按照该字段值提取出来
      result[groupKey] = currentValue

      return result
    },
    {} as Record<string, T>,
  )
}

export const hasDuplicate = (arr: any[], field: string): boolean => {
  const seen = new Set()
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i][field]
    if (seen.has(value)) {
      return true // 如果已经存在该值，说明有重复
    }
    seen.add(value) // 将该值加入集合
  }
  return false // 没有重复
}

export const getDuplicateKeys = (arr: any[], fields: string | string[], initial: any[] = []): any[] => {
  if (arr.length === 1) return []

  const normalizedFields = Array.isArray(fields) ? fields : [fields]
  const checkedItems: any[] = [] // 用于保存已检查的所有元素

  return arr.reduce((pre, cur) => {
    // 检查当前元素是否和已检查的元素重复
    const isDuplicate = checkedItems.some((item: any) =>
      normalizedFields.some((field: string) => item[field] === cur[field]),
    )

    if (isDuplicate) {
      pre.push(cur) // 如果是重复项，加入结果数组
    }

    checkedItems.push(cur) // 无论是否重复，都加入已检查项

    return pre // 返回结果数组
  }, initial) // 初始值为空数组或由外部传入的值
}

export const groupBy = <T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> => {
  return array.reduce(
    (result, item) => {
      // 获取分组的 key，确保其为 string 类型
      const groupKey = typeof key === 'function' ? key(item) : String(item[key]) // 强制转换为 string

      // 如果该 groupKey 不存在，就初始化一个数组
      if (!result[groupKey]) {
        result[groupKey] = []
      }

      // 将 item 添加到对应的分组
      result[groupKey].push(item)

      return result
    },
    {} as Record<string, T[]>,
  )
}

// 对分组后的数据进行排序
export function sortGroupedData<T>(
  groupedData: Record<string, T[]>,
  sortBy: keyof T, // Sort by a specific property of the group items
): Record<string, T[]> {
  const sortedGroupedData: Record<string, T[]> = {}

  Object.keys(groupedData).forEach(key => {
    // Sort the items inside the group
    sortedGroupedData[key] = groupedData[key].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) {
        return -1
      }
      if (a[sortBy] > b[sortBy]) {
        return 1
      }
      return 0
    })
  })

  return sortedGroupedData
}

type SortOrder = 'asc' | 'desc'

interface SortField {
  field: string // 排序字段名
  order: SortOrder // 排序方式（'asc' 或 'desc'）
}

export function sortData<T>(data: T[], sortBy: (SortField | keyof T)[], sortOrder?: SortOrder): T[] {
  return data.sort((a, b) => {
    for (let i = 0; i < sortBy.length; i++) {
      let field: string
      let order: SortOrder

      // 类型保护：检查是否为 SortField
      if (typeof sortBy[i] === 'string') {
        field = sortBy[i] as string
        order = sortOrder ?? 'asc' // 如果没有传入 sortOrder 参数，默认为 'asc'
      } else {
        const item = sortBy[i] as SortField
        field = item.field
        order = item.order
      }

      const valueA = a[field as keyof T]
      const valueB = b[field as keyof T]

      let comparison = 0

      if (valueA < valueB) {
        comparison = -1
      } else if (valueA > valueB) {
        comparison = 1
      }

      // 根据排序顺序决定升序或降序
      if (order === 'desc') {
        comparison = -comparison
      }

      // 如果当前字段排序结果是 0，则继续比较下一个字段
      if (comparison !== 0) {
        return comparison
      }
    }

    return 0 // 如果所有字段都相等，则不排序
  })
}

export const hasCommonElements = (arr1: string[], arr2: string[], minCommonElements: number = 2): boolean => {
  // 如果数组为空，返回 false
  if (arr1.length === 0 || arr2.length === 0) {
    return false
  }

  // 如果其中一个数组只有一个元素，直接在另一个数组中查找该元素
  if (arr1.length === 1 || arr2.length === 1) {
    return arr1.some(item => arr2.includes(item)) || arr2.some(item => arr1.includes(item))
  }

  // 正则匹配，去除元素中的括号及其内容
  const normalize = (str: string): string => {
    return str.replace(/\(.*\)/g, '')
  }

  // 对两个数组中的元素进行归一化处理
  const normalizedArr1 = arr1.map(normalize)
  const normalizedArr2 = arr2.map(normalize)

  // 计算交集数量
  const commonElements = normalizedArr1.filter(item => normalizedArr2.includes(item))

  // 如果交集的数量大于等于指定的最小数量，返回 true，否则返回 false
  return commonElements.length >= minCommonElements
}
