import type { Timestamp } from 'firebase/firestore'
interface TimeFormat {
  h: number
  m: number
  s: number
}

export const formatSecondsToHHmmss = (seconds: number, sep?: string): string => {
  const seqSymbol = sep || ':'
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${hrs}${seqSymbol}${mins}${seqSymbol}${secs}`
}

export const formatSecondsToHHmmssWithDecimals = (
  seconds: number,
  options: {
    sep?: string // 分隔符
    decimalPlaces?: number // 小数位数
    showDecimal?: boolean // 是否显示小数
  } = {},
): string => {
  const { sep = ':', decimalPlaces = 2, showDecimal = true } = options

  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const secs = showDecimal
    ? (seconds % 60).toFixed(decimalPlaces).padStart(2 + decimalPlaces, '0')
    : Math.floor(seconds % 60)
        .toString()
        .padStart(2, '0')

  return `${hrs}${sep}${mins}${sep}${secs}`
}

export const parseHHmmssToSeconds = (timeStr: string, sep?: string): number => {
  const seqSymbol = sep || ':' // 默认分隔符为冒号
  const timeParts = timeStr.split(seqSymbol) // 按照分隔符拆分时间字符串

  // 解析小时、分钟、秒
  const hours = parseInt(timeParts[0], 10)
  const minutes = parseInt(timeParts[1], 10)
  const seconds = parseInt(timeParts[2], 10)

  // 计算总秒数
  return hours * 3600 + minutes * 60 + seconds
}
export const convertSecondsToTime = (seconds: number): TimeFormat => {
  const h = Math.floor(seconds / 3600) // 计算小时数
  const m = Math.floor((seconds % 3600) / 60) // 计算分钟数
  const s = seconds % 60 // 计算剩余秒数

  return { h, m, s }
}

export const transFBDate2Local = (date?: Timestamp) => {
  if (!date) return null
  try {
    const localDate = date.toDate()

    // 格式化日期（你可以根据需要调整格式）
    // 格式化日期和时间
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 使用 24 小时制
    }

    const result = localDate.toLocaleDateString('en-US', options)

    return result
  } catch (error) {
    console.log('transFBDate error:', error)
    return null
  }
}

/**
 * 格式化日期函数
 *
 * @param {Date} [date=new Date()] - 要格式化的日期对象，默认为当前日期。
 * @param {FormatOptions} [options=defaultOptions] - 格式化选项。
 * @param {string} [options.locale] - 本地化语言环境，默认为 'en-US'。
 * @param {'full' | 'long' | 'medium' | 'short'} [options.dateStyle] - 日期格式样式。
 * @param {'full' | 'long' | 'medium' | 'short'} [options.timeStyle] - 时间格式样式。
 * @param {string} [options.customFormat] - 自定义格式字符串，例如 'YYYY-MM-DD HH:mm:ss'。
 *
 * @returns {string} - 格式化后的日期字符串。
 *
 * @example
 * // 使用默认格式
 * const formattedDate1 = formatDate(new Date());
 * console.log(formattedDate1); // 输出示例： "Aug 1, 2024, 12:34:56 PM"
 *
 * @example
 * // 使用本地化格式
 * const formattedDate2 = formatDate(new Date(), {
 *   locale: 'fr-FR',
 *   dateStyle: 'full',
 *   timeStyle: 'short',
 * });
 * console.log(formattedDate2); // 输出示例： "jeudi 1 août 2024 à 12:34"
 *
 * @example
 * // 使用自定义格式
 * const formattedDate3 = formatDate(new Date(), {
 *   customFormat: 'YYYY-MM-DD HH:mm:ss',
 * });
 * console.log(formattedDate3); // 输出示例： "2024-08-01 12:34:56"
 */
export const formatDate = (
  date: Date = new Date(),
  options: FormatOptions = defaultOptions,
): string => {
  const { locale, dateStyle, timeStyle, customFormat } = options

  if (customFormat) {
    // 自定义格式实现
    return customFormat
      .replace('YYYY', date.getFullYear().toString())
      .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
      .replace('DD', date.getDate().toString().padStart(2, '0'))
      .replace('HH', date.getHours().toString().padStart(2, '0'))
      .replace('mm', date.getMinutes().toString().padStart(2, '0'))
      .replace('ss', date.getSeconds().toString().padStart(2, '0'))
  }

  // 使用Intl.DateTimeFormat进行本地化格式化
  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
  }).format(date)
}

// 定义格式选项接口
interface FormatOptions {
  locale?: string
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
  customFormat?: string
}

// 默认格式选项
const defaultOptions: FormatOptions = {
  locale: 'en-US',
  dateStyle: 'medium',
  timeStyle: 'medium',
}

// 定义一个类型 T，它至少应该有一个 createTime 字段
interface TimeField {
  createTime: Timestamp
}

// 定义通用的分组类型
export type Grouped<T> = {
  today: T[]
  yesterday: T[]
  last7Days: T[]
  last30Days: T[]
  earlier: T[]
  monthly: Record<string, T[]> // 按月份分组的记录
}

export const groupByTime = <T extends TimeField>(data: T[]): Grouped<T> => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const grouped: Grouped<T> = {
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: [],
    monthly: {}, // 按月份分组的对象
    earlier: [],
  }

  data.forEach(item => {
    const createTime = item.createTime.toDate() // 转换为 Date 对象

    if (createTime >= today) {
      grouped.today.push(item)
    } else if (createTime >= yesterday) {
      grouped.yesterday.push(item)
    } else if (createTime >= sevenDaysAgo) {
      grouped.last7Days.push(item)
    } else if (createTime >= thirtyDaysAgo) {
      grouped.last30Days.push(item)
    } else {
      // 处理每年和每月的分组
      const year = createTime.getFullYear()
      const month = createTime.toLocaleString('default', { month: 'long' }) // 获取月份名称

      if (year === now.getFullYear()) {
        // 本年度的分组
        if (!grouped.monthly[month]) {
          grouped.monthly[month] = []
        }
        grouped.monthly[month].push(item)
      } else {
        // 早于当前年份的条目
        grouped.earlier.push(item)
      }
    }
  })

  return grouped
}
