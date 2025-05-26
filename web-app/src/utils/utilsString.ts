export const getNameWithoutExtension = (input: string): string => {
  const parts = input.split('.')
  if (parts.length === 1) return input // 如果没有扩展名，返回原始输入
  return parts.slice(0, -1).join('.') // 去掉扩展名并返回基础名称
}
export const getFileName = (path: string, ext?: string): string => {
  // 1. 从路径中获取文件名
  let filename = path.split('/').pop() || ''

  // 2. 如果提供了扩展名参数，移除扩展名
  if (ext && filename.endsWith(ext)) {
    filename = filename.slice(0, -ext.length)
  }

  return filename
}

export const joinPaths = (...paths: string[]): string => {
  // 去除每个路径的结尾斜杠，并将路径用斜杠连接起来
  return paths
    .map(path => path.replace(/\/+$/, '')) // 移除多余的结尾斜杠
    .join('/')
    .replace(/^\/+/, '') // 移除开头多余的斜杠
}

type Path = string

// 解析并拼接路径
export const resolvePath = (basePath: Path, ...paths: Path[]): Path => {
  let currentPath: Path = basePath

  // 如果没有路径参数，直接返回当前路径
  if (paths.length === 0) {
    return currentPath
  }

  // 遍历所有路径片段
  for (const segment of paths) {
    // 跳过空路径
    if (!segment) continue

    // 如果路径是绝对路径（以 / 开头），就直接覆盖当前路径
    if (segment.startsWith('/')) {
      currentPath = segment
    } else {
      // 否则，拼接到当前路径
      currentPath = currentPath.replace(/\/$/, '') + '/' + segment
    }
  }

  // 规范化路径，处理 . 和 ..
  return normalize(currentPath)
}

// 规范化路径，处理 `..` 和 `.`
function normalize(path: Path): Path {
  const segments = path.split('/')

  const stack: string[] = []

  for (const segment of segments) {
    if (segment === '' || segment === '.') {
      // 跳过空路径或当前目录符号
      continue
    }

    if (segment === '..') {
      // 父目录，弹出栈顶元素
      stack.pop()
    } else {
      // 普通目录，推入栈
      stack.push(segment)
    }
  }

  // 返回规范化后的路径
  return '/' + stack.join('/')
}

export function getMessagePreviewType(content: any): string {
  if (!content) return ''

  // 文件对象（浏览器 File 类型）
  if (typeof File !== 'undefined' && content instanceof File) {
    const type = content.type
    if (type.startsWith('image/')) return '[image]'
    if (type === 'application/pdf') return '[pdf]'
    return '[file]'
  }

  // Base64 图片 / PDF 判断
  if (typeof content === 'string' && content.startsWith('data:')) {
    if (content.startsWith('data:image/')) return '[image]'
    if (content.startsWith('data:application/pdf')) return '[pdf]'
    return '[file]'
  }

  // 普通文本（保留前 20 字）
  if (typeof content === 'string') {
    return content.length > 20 ? content.slice(0, 20) + '...' : content
  }

  // 其他类型
  return '[unknown]'
}
