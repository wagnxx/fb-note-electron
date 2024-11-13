export const getNameWithoutExtension = (input: string): string => {
  const parts = input.split('.')
  if (parts.length === 1) return input // 如果没有扩展名，返回原始输入
  return parts.slice(0, -1).join('.') // 去掉扩展名并返回基础名称
}
