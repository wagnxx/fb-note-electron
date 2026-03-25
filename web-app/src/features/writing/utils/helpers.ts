// Writing utility functions
import type { WritingType } from '@shared/types/writing'
import type { WritingChapter, WritingVolume } from '@/features/writing/types'
import i18n from '@/i18n'

export const CHAPTERED_TYPES: WritingType[] = ['novel', 'short_story', 'video_script']
export const VOLUME_TYPES: WritingType[] = ['novel']

export const hasChapters = (type: WritingType): boolean => CHAPTERED_TYPES.includes(type)
export const hasVolumes = (type: WritingType): boolean => VOLUME_TYPES.includes(type)

const getCurrentLocale = () => (i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US')

const WRITING_TYPE_I18N_KEYS: Record<WritingType, { label: string; description: string }> = {
  article: {
    label: 'writing.types.article.label',
    description: 'writing.types.article.description',
  },
  short_story: {
    label: 'writing.types.short_story.label',
    description: 'writing.types.short_story.description',
  },
  video_script: {
    label: 'writing.types.video_script.label',
    description: 'writing.types.video_script.description',
  },
  novel: {
    label: 'writing.types.novel.label',
    description: 'writing.types.novel.description',
  },
}

export const getEntryLabel = (type: WritingType): string => {
  if (type === 'video_script') return i18n.t('writing.common.section')
  return i18n.t('writing.common.chapter')
}

export const getHierarchyLabel = (type: WritingType): string => {
  if (type === 'novel') return i18n.t('writing.common.volumeAndChapter')
  if (type === 'video_script') return i18n.t('writing.common.section')
  return i18n.t('writing.common.chapters')
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
    label: 'writing.types.article.label',
    description: 'writing.types.article.description',
  },
  {
    value: 'short_story',
    label: 'writing.types.short_story.label',
    description: 'writing.types.short_story.description',
  },
  {
    value: 'video_script',
    label: 'writing.types.video_script.label',
    description: 'writing.types.video_script.description',
  },
  {
    value: 'novel',
    label: 'writing.types.novel.label',
    description: 'writing.types.novel.description',
  },
]

export const getWritingTypeLabel = (type: WritingType): string => {
  const keys = WRITING_TYPE_I18N_KEYS[type]
  if (!keys) return type
  return i18n.t(keys.label)
}

export const getWritingTypeDescription = (type: WritingType): string => {
  const keys = WRITING_TYPE_I18N_KEYS[type]
  if (!keys) return ''
  return i18n.t(keys.description)
}

export const generateWritingTitle = (type: WritingType, customTitle?: string): string => {
  if (customTitle) return customTitle

  const now = new Date()
  const dateStr = now.toLocaleDateString(getCurrentLocale())
  const typeLabel = getWritingTypeLabel(type)

  return i18n.t('writing.common.generatedTitle', { typeLabel, date: dateStr })
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
    errors.push(i18n.t('writing.validation.typeRequired'))
  }

  if (!data.title || data.title.trim().length === 0) {
    errors.push(i18n.t('writing.validation.titleRequired'))
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
      errors.push(i18n.t('writing.validation.atLeastOneVolume'))
    }
    if (!hasChapter) {
      errors.push(i18n.t('writing.validation.atLeastOneChapter'))
    }
    if (!hasAnyContent) {
      errors.push(i18n.t('writing.validation.chapterContentRequired'))
    }
  } else {
    // article / short_story / video_script 统一走单篇内容校验
    if (!data.content || data.content.trim().length === 0) {
      errors.push(i18n.t('writing.validation.contentRequired'))
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const formatWritingDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString(getCurrentLocale(), {
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
