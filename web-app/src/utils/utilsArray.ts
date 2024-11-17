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
export const calculateMiddleValue: (
  numbers: number[],
  referenceValue: number,
  interval: number,
) => number = (numbers: number[], referenceValue: number, interval: number = 100) => {
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
