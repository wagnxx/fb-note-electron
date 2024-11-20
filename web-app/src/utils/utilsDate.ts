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
