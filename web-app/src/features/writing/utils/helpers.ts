// Writing utility functions
import type { WritingType } from '@shared/types/writing'
import type { WritingChapter, WritingVolume } from '@/features/writing/types'

export const CHAPTERED_TYPES: WritingType[] = ['novel', 'short_story', 'video_script']
export const VOLUME_TYPES: WritingType[] = ['novel']

export const hasChapters = (type: WritingType): boolean => CHAPTERED_TYPES.includes(type)
export const hasVolumes = (type: WritingType): boolean => VOLUME_TYPES.includes(type)

export const getEntryLabel = (type: WritingType): string => {
  if (type === 'video_script') return '节'
  return '章'
}

export const getHierarchyLabel = (type: WritingType): string => {
  if (type === 'novel') return '卷 / 章'
  if (type === 'video_script') return '节'
  return '章节'
}

export const getAllNestedChapters = (
  type: WritingType,
  volumes?: WritingVolume[],
  chapters?: WritingChapter[],
): WritingChapter[] => {
  if (hasVolumes(type)) {
    return (volumes ?? []).flatMap(volume => volume.chapters ?? [])
  }
  return chapters ?? []
}

export const WRITING_TYPES: { value: WritingType; label: string; description: string }[] = [
  {
    value: 'article',
    label: '文章',
    description: '博客文章、技术文档等',
  },
  {
    value: 'short_story',
    label: '短篇故事',
    description: '短篇小说、微小说等',
  },
  {
    value: 'video_script',
    label: '视频剧本',
    description: '视频脚本、广告脚本等',
  },
  {
    value: 'novel',
    label: '小说',
    description: '长篇小说、系列小说等',
  },
]

export const getWritingTypeLabel = (type: WritingType): string => {
  const typeInfo = WRITING_TYPES.find(t => t.value === type)
  return typeInfo?.label || type
}

export const getWritingTypeDescription = (type: WritingType): string => {
  const typeInfo = WRITING_TYPES.find(t => t.value === type)
  return typeInfo?.description || ''
}

export const generateWritingTitle = (type: WritingType, customTitle?: string): string => {
  if (customTitle) return customTitle

  const now = new Date()
  const dateStr = now.toLocaleDateString('zh-CN')
  const typeLabel = getWritingTypeLabel(type)

  return `${typeLabel} - ${dateStr}`
}

export const validateWritingData = (data: {
  type: WritingType
  title: string
  content: string
  volumes?: Array<{ chapters: Array<{ content: string }> }>
  chapters?: Array<{ content: string }>
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!data.type) {
    errors.push('类型不能为空')
  }

  if (!data.title || data.title.trim().length === 0) {
    errors.push('标题不能为空')
  }

  if (hasVolumes(data.type)) {
    // 小说：卷 → 章 结构
    const volumes = data.volumes ?? []
    const hasVolume = volumes.length > 0
    const hasChapter = volumes.some(volume => (volume.chapters ?? []).length > 0)
    const hasAnyContent = volumes.some(volume =>
      (volume.chapters ?? []).some(chapter => chapter.content.trim().length > 0),
    )

    if (!hasVolume) {
      errors.push('至少需要一个卷')
    }
    if (!hasChapter) {
      errors.push('至少需要一个章节')
    }
    if (!hasAnyContent) {
      errors.push('章节内容不能为空')
    }
  } else {
    // article / short_story / video_script 统一走单篇内容校验
    if (!data.content || data.content.trim().length === 0) {
      errors.push('内容不能为空')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const formatWritingDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const extractTagsFromContent = (content: string): string[] => {
  // 简单的标签提取逻辑，可以根据需要扩展
  const tagRegex = /#(\w+)/g
  const tags: string[] = []
  let match

  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1])
  }

  return [...new Set(tags)] // 去重
}
