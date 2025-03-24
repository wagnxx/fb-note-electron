export const colors = [
  'processing',
  'success',
  'error',
  'warning',
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
]

export const shuffleColors = (arr: string[] = colors) => {
  let shuffled = [...arr] // 拷贝一份数组，避免改变原数组
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// colorUtils.ts
export function darkenColor(color: string, amount: number = 10): string {
  // 解析颜色
  const hsl = colorToHSL(color)
  if (!hsl) {
    throw new Error(`Invalid color format: ${color}`)
  }

  // 降低亮度（L），确保不会小于 0%
  hsl.l = Math.max(0, hsl.l - amount)

  // 转换回 HEX 并返回
  return hslToHex(hsl.h, hsl.s, hsl.l)
}

/** 将 HEX 或 RGB 颜色转换为 HSL */
function colorToHSL(color: string): { h: number; s: number; l: number } | null {
  let r: number, g: number, b: number

  if (color.startsWith('#')) {
    // 处理 HEX 颜色
    const hex = color.slice(1)
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    } else {
      return null
    }
  } else if (color.startsWith('rgb')) {
    // 处理 RGB 颜色
    const match = color.match(/\d+/g)
    if (!match || match.length < 3) return null
    r = parseInt(match[0], 10)
    g = parseInt(match[1], 10)
    b = parseInt(match[2], 10)
  } else {
    return null
  }

  // 归一化 RGB 值
  r /= 255
  g /= 255
  b /= 255

  // 获取最大最小值
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0,
    s = 0,
    l = (max + min) / 2

  // 计算色相（H）
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else if (max === b) h = (r - g) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  // 计算饱和度（S）
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/** 将 HSL 颜色转换为 HEX */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0,
    g = 0,
    b = 0

  if (0 <= h && h < 60) [r, g, b] = [c, x, 0]
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0]
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x]
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c]
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c]
  else if (300 <= h && h < 360) [r, g, b] = [c, 0, x]

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`
}
