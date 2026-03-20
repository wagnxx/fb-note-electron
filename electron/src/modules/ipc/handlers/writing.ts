import path from 'path'
import fs from 'fs'
import { ipcMain } from 'electron'
import { logger } from '@/utils/logger'
import { getSupportPath } from '@/config/basic'
import { IPC_ACTIONS } from '@shared/ipcActions'
import type {
  WritingItem,
  WritingType,
  WritingBase,
  WritingExportData,
  WritingChapter,
  WritingVolume,
  WritingSaveRequest,
} from '@shared/types/writing'
import { hasChapters, hasVolumes } from '@shared/types/writing'

type WritingChapterMeta = Omit<WritingChapter, 'content'> & {
  wordCount?: number
}
type WritingVolumeMeta = Omit<WritingVolume, 'chapters'> & {
  wordCount?: number
  chapters: WritingChapterMeta[]
}

type WritingItemMeta = Omit<WritingItem, 'content' | 'chapters' | 'volumes'> & {
  wordCount?: number
  chapterCount?: number
  chapters?: WritingChapterMeta[]
  volumes?: WritingVolumeMeta[]
}

// 获取写作目录路径
function getWritingDir(): string {
  return getSupportPath('writing')
}

// 获取特定类型的写作目录
function getWritingTypeDir(type: WritingType): string {
  return path.join(getWritingDir(), type)
}

function getArticleMetaPath(id: string): string {
  return path.join(getWritingTypeDir('article'), `${id}.meta.json`)
}

function getArticleMarkdownPath(id: string): string {
  return path.join(getWritingTypeDir('article'), `${id}.md`)
}

function getChapteredEntryDir(type: WritingType, id: string): string {
  return path.join(getWritingTypeDir(type), id)
}

function getChapteredMetaPath(type: WritingType, id: string): string {
  return path.join(getChapteredEntryDir(type, id), 'meta.json')
}

function getChapterMarkdownPath(type: WritingType, id: string, chapterId: string): string {
  return path.join(getChapteredEntryDir(type, id), `${chapterId}.md`)
}

// 确保目录存在
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    logger.info(`Created directory: ${dirPath}`)
  }
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 生成章节ID
function generateChapterId(): string {
  return 'ch_' + generateId()
}

function generateVolumeId(): string {
  return 'vol_' + generateId()
}

function writeMarkdownWithH1(filePath: string, title: string, content: string): void {
  const normalizedTitle = (title || '未命名章节').trim() || '未命名章节'
  const normalizedContent = content || ''
  const markdown = `# ${normalizedTitle}\n\n${normalizedContent}`
  fs.writeFileSync(filePath, markdown, 'utf-8')
}

function parseMarkdownWithH1(markdown: string): { title: string; content: string } {
  const normalized = markdown.replace(/^\uFEFF/, '')
  const lines = normalized.split(/\r?\n/)
  const firstLine = lines[0] ?? ''

  if (/^#\s+/.test(firstLine)) {
    const title = firstLine.replace(/^#\s+/, '').trim()
    const content = lines
      .slice(1)
      .join('\n')
      .replace(/^\s*\n/, '')
    return {
      title: title || '未命名章节',
      content,
    }
  }

  return {
    title: '未命名章节',
    content: normalized,
  }
}

function loadMarkdownWithFallback(filePath: string, fallbackTitle: string): { title: string; content: string } {
  if (!fs.existsSync(filePath)) {
    return { title: fallbackTitle, content: '' }
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = parseMarkdownWithH1(raw)
  if (parsed.title === '未命名章节' && fallbackTitle.trim()) {
    return { title: fallbackTitle, content: parsed.content }
  }
  return parsed
}

function removeDirRecursive(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

function getWordCount(content: string): number {
  return (content || '').replace(/\s/g, '').length
}

function toChapterMeta(chapter: WritingChapter, chapterIndex: number): WritingChapterMeta {
  return {
    id: chapter.id,
    title: chapter.title,
    order: chapterIndex,
    wordCount: getWordCount(chapter.content),
  }
}

// 初始化章节类型的默认章节
function buildInitialChapters(type: WritingType, content: string): WritingChapter[] {
  // 如果已有内容，作为第一章
  const defaultTitle = type === 'video_script' ? '第一节' : '第一章'
  if (content && content.trim()) {
    return [{ id: generateChapterId(), title: defaultTitle, content, order: 0 }]
  }
  return [{ id: generateChapterId(), title: defaultTitle, content: '', order: 0 }]
}

function buildInitialVolumes(content: string): WritingVolume[] {
  return [
    {
      id: generateVolumeId(),
      title: '第一卷',
      order: 0,
      chapters: buildInitialChapters('novel', content),
    },
  ]
}

function normalizeVolumes(volumes: WritingVolume[] = []): WritingVolume[] {
  return volumes.map((volume, volumeIndex) => ({
    ...volume,
    order: volumeIndex,
    chapters: (volume.chapters ?? []).map((chapter, chapterIndex) => ({
      ...chapter,
      order: chapterIndex,
    })),
  }))
}

function normalizeChapters(chapters: WritingChapter[] = []): WritingChapter[] {
  return chapters.map((chapter, chapterIndex) => ({
    ...chapter,
    order: chapterIndex,
  }))
}

function normalizeChapterMeta(chapters: WritingChapterMeta[] = []): WritingChapterMeta[] {
  return chapters.map((chapter, chapterIndex) => ({
    ...chapter,
    order: chapterIndex,
  }))
}

function normalizeVolumeMeta(volumes: WritingVolumeMeta[] = []): WritingVolumeMeta[] {
  return volumes.map((volume, volumeIndex) => ({
    ...volume,
    order: volumeIndex,
    chapters: normalizeChapterMeta(volume.chapters ?? []),
  }))
}

function _getSummaryFromWriting(writing: WritingItem): string {
  if (hasVolumes(writing.type) && writing.volumes && writing.volumes.length > 0) {
    const sortedVolumes = [...writing.volumes].sort((a, b) => a.order - b.order)
    const firstVolume = sortedVolumes[0]
    const sortedChapters = [...(firstVolume.chapters ?? [])].sort((a, b) => a.order - b.order)
    const firstChapter = sortedChapters[0]

    if (firstChapter) {
      const firstContent = firstChapter.content.replace(/\s+/g, ' ').trim().slice(0, 80)
      const chapterCount = sortedVolumes.reduce((total, volume) => total + (volume.chapters?.length ?? 0), 0)
      return `共 ${sortedVolumes.length} 卷 / ${chapterCount} 章 · ${firstContent}`
    }
  }

  if (hasChapters(writing.type) && writing.chapters && writing.chapters.length > 0) {
    const sortedChapters = [...writing.chapters].sort((a, b) => a.order - b.order)
    const firstChapter = sortedChapters[0]
    const label = writing.type === 'video_script' ? '节' : '章'
    const firstContent = firstChapter.content.replace(/\s+/g, ' ').trim().slice(0, 80)
    return `共 ${sortedChapters.length} ${label} · ${firstContent}`
  }

  return writing.content.replace(/\s+/g, ' ').trim().slice(0, 120)
}

function buildWritingItemFromMeta(meta: WritingItemMeta): WritingItem {
  if (hasVolumes(meta.type)) {
    const volumes: WritingVolume[] = (meta.volumes ?? []).map(volume => ({
      id: volume.id,
      title: volume.title,
      order: volume.order,
      chapters: (volume.chapters ?? []).map(chapter => {
        const chapterPath = getChapterMarkdownPath(meta.type, meta.id, chapter.id)
        const md = loadMarkdownWithFallback(chapterPath, chapter.title)
        return {
          id: chapter.id,
          title: md.title,
          content: md.content,
          order: chapter.order,
        }
      }),
    }))

    return {
      ...meta,
      content: '',
      volumes,
      chapters: undefined,
    }
  }

  if (hasChapters(meta.type)) {
    const chapters: WritingChapter[] = (meta.chapters ?? []).map(chapter => {
      const chapterPath = getChapterMarkdownPath(meta.type, meta.id, chapter.id)
      const md = loadMarkdownWithFallback(chapterPath, chapter.title)
      return {
        id: chapter.id,
        title: md.title,
        content: md.content,
        order: chapter.order,
      }
    })

    return {
      ...meta,
      content: '',
      chapters,
      volumes: undefined,
    }
  }

  const articleMarkdownPath = getArticleMarkdownPath(meta.id)
  const articleRaw = fs.existsSync(articleMarkdownPath) ? fs.readFileSync(articleMarkdownPath, 'utf-8') : ''
  const articleParsed = parseMarkdownWithH1(articleRaw)

  return {
    ...meta,
    content: articleParsed.content,
    chapters: undefined,
    volumes: undefined,
  }
}

function saveChapterMarkdown(type: WritingType, writingId: string, chapter: WritingChapter): void {
  const chapterPath = getChapterMarkdownPath(type, writingId, chapter.id)
  writeMarkdownWithH1(chapterPath, chapter.title, chapter.content)
}

// 初始化写作目录结构
function initWritingDirectories(): void {
  const writingDir = getWritingDir()
  const types: WritingType[] = ['article', 'short_story', 'video_script', 'novel']

  ensureDir(writingDir)
  types.forEach(type => {
    ensureDir(getWritingTypeDir(type))
  })

  logger.info('Writing directories initialized')
}

// 保存写作内容
async function saveWriting(data: WritingSaveRequest): Promise<string> {
  const typeDir = getWritingTypeDir(data.type)
  ensureDir(typeDir)

  const id = data.id || generateId()
  const now = new Date().toISOString()
  const existingWriting = data.id ? loadWriting(data.type, data.id) : null

  let volumes = data.volumes
  let chapters = data.chapters

  if (hasVolumes(data.type)) {
    if (!volumes || volumes.length === 0) {
      volumes = buildInitialVolumes(data.content)
    }
    volumes = normalizeVolumes(volumes)
    chapters = undefined
  } else if (hasChapters(data.type)) {
    if (!chapters || chapters.length === 0) {
      chapters = buildInitialChapters(data.type, data.content)
    }
    chapters = normalizeChapters(chapters)
    volumes = undefined
  }

  if (data.type === 'article') {
    const wordCount = getWordCount(data.content || '')
    const articleMeta: WritingItemMeta = {
      id,
      type: 'article',
      title: data.title,
      createdAt: existingWriting?.createdAt || now,
      updatedAt: now,
      tags: data.tags ?? existingWriting?.tags ?? [],
      metadata: data.metadata ?? existingWriting?.metadata,
      wordCount,
      chapterCount: 0,
    }

    fs.writeFileSync(getArticleMetaPath(id), JSON.stringify(articleMeta, null, 2), 'utf-8')
    writeMarkdownWithH1(getArticleMarkdownPath(id), data.title, data.content || '')
    logger.info(`Saved writing: ${data.title} (${id})`)
    return id
  }

  const entryDir = getChapteredEntryDir(data.type, id)
  ensureDir(entryDir)

  if (hasVolumes(data.type)) {
    const normalizedVolumes = normalizeVolumes(volumes ?? [])
    const volumesMeta: WritingVolumeMeta[] = normalizeVolumes(normalizedVolumes).map((volume, volumeIndex) => {
      const chaptersMeta = (volume.chapters ?? []).map((chapter, chapterIndex) => {
        saveChapterMarkdown(data.type, id, chapter)
        return toChapterMeta(chapter, chapterIndex)
      })

      const volumeWordCount = chaptersMeta.reduce((sum, chapter) => sum + (chapter.wordCount ?? 0), 0)

      return {
        id: volume.id,
        title: volume.title,
        order: volumeIndex,
        wordCount: volumeWordCount,
        chapters: chaptersMeta,
      }
    })

    const chapterCount = volumesMeta.reduce((sum, volume) => sum + (volume.chapters?.length ?? 0), 0)

    const writingMeta: WritingItemMeta = {
      id,
      type: data.type,
      title: data.title,
      createdAt: existingWriting?.createdAt || now,
      updatedAt: now,
      tags: data.tags ?? existingWriting?.tags ?? [],
      metadata: data.metadata ?? existingWriting?.metadata,
      chapterCount,
      volumes: normalizeVolumeMeta(volumesMeta),
      chapters: undefined,
    }

    fs.writeFileSync(getChapteredMetaPath(data.type, id), JSON.stringify(writingMeta, null, 2), 'utf-8')
  } else if (hasChapters(data.type)) {
    const normalized = normalizeChapters(chapters ?? [])
    const chapterMeta = normalizeChapterMeta(
      normalized.map((chapter, chapterIndex) => {
        saveChapterMarkdown(data.type, id, chapter)
        return toChapterMeta(chapter, chapterIndex)
      }),
    )

    const chapterCount = chapterMeta.length

    const writingMeta: WritingItemMeta = {
      id,
      type: data.type,
      title: data.title,
      createdAt: existingWriting?.createdAt || now,
      updatedAt: now,
      tags: data.tags ?? existingWriting?.tags ?? [],
      metadata: data.metadata ?? existingWriting?.metadata,
      chapterCount,
      chapters: chapterMeta,
      volumes: undefined,
    }

    fs.writeFileSync(getChapteredMetaPath(data.type, id), JSON.stringify(writingMeta, null, 2), 'utf-8')
  }

  logger.info(`Saved writing: ${data.title} (${id})`)
  return id
}

// 加载写作内容
function loadWriting(type: WritingType, id: string): WritingItem | null {
  try {
    if (type === 'article') {
      const metaPath = getArticleMetaPath(id)
      if (!fs.existsSync(metaPath)) {
        return null
      }
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as WritingItemMeta
      return buildWritingItemFromMeta(meta)
    }

    const metaPath = getChapteredMetaPath(type, id)
    if (!fs.existsSync(metaPath)) {
      return null
    }
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as WritingItemMeta
    return buildWritingItemFromMeta(meta)
  } catch (error) {
    logger.error(`Failed to load writing ${id}:`, error)
    return null
  }
}

// 获取写作内容列表
function listWritings(type: WritingType): WritingBase[] {
  const typeDir = getWritingTypeDir(type)

  if (!fs.existsSync(typeDir)) {
    return []
  }

  try {
    const writings: WritingBase[] = []

    if (type === 'article') {
      const metaFiles = fs
        .readdirSync(typeDir)
        .filter(file => file.endsWith('.meta.json'))
        .map(file => path.join(typeDir, file))

      for (const filePath of metaFiles) {
        try {
          const meta = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as WritingItemMeta
          const descriptionFromMetadata = meta.metadata?.description
          const description =
            typeof descriptionFromMetadata === 'string' && descriptionFromMetadata.trim().length > 0
              ? descriptionFromMetadata
              : '暂无描述'

          let wordCount = meta.wordCount ?? 0
          if (typeof meta.wordCount !== 'number') {
            // 旧数据没有 wordCount，从 .md 文件读取并写回
            const mdPath = getArticleMarkdownPath(meta.id)
            const raw = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf-8') : ''
            const parsed = parseMarkdownWithH1(raw)
            wordCount = getWordCount(parsed.content)
            meta.wordCount = wordCount
            fs.writeFileSync(filePath, JSON.stringify(meta, null, 2), 'utf-8')
            logger.info(`Migrated wordCount for article ${meta.id}`)
          }
          const chapterCount =
            typeof meta.chapterCount === 'number'
              ? meta.chapterCount
              : hasVolumes(meta.type)
                ? (meta.volumes ?? []).reduce((sum, volume) => sum + (volume.chapters?.length ?? 0), 0)
                : (meta.chapters ?? []).length
          writings.push({
            id: meta.id,
            title: meta.title,
            description,
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt,
            tags: meta.tags,
            wordCount,
            chapterCount,
          })
        } catch (error) {
          logger.error(`Failed to parse writing file ${filePath}:`, error)
        }
      }
    } else {
      const entryDirs = fs
        .readdirSync(typeDir)
        .map(name => path.join(typeDir, name))
        .filter(entryPath => fs.existsSync(entryPath) && fs.statSync(entryPath).isDirectory())

      for (const entryDir of entryDirs) {
        const metaPath = path.join(entryDir, 'meta.json')
        if (!fs.existsSync(metaPath)) {
          continue
        }

        try {
          let meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as WritingItemMeta
          const descriptionFromMetadata = meta.metadata?.description
          const description =
            typeof descriptionFromMetadata === 'string' && descriptionFromMetadata.trim().length > 0
              ? descriptionFromMetadata
              : '暂无描述'

          // 检测旧数据：章节没有 wordCount 字段，需要从 .md 文件读取并写回 meta（一次性迁移）
          const needsMigration = hasVolumes(meta.type)
            ? (meta.volumes ?? []).some(volume =>
                (volume.chapters ?? []).some(chapter => typeof chapter.wordCount !== 'number'),
              )
            : (meta.chapters ?? []).some(chapter => typeof chapter.wordCount !== 'number')

          if (needsMigration) {
            let metaDirty = false
            if (hasVolumes(meta.type)) {
              meta.volumes = (meta.volumes ?? []).map(volume => {
                const updatedChapters = (volume.chapters ?? []).map(chapter => {
                  if (typeof chapter.wordCount === 'number') return chapter
                  const mdPath = getChapterMarkdownPath(meta.type, meta.id, chapter.id)
                  const raw = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf-8') : ''
                  const parsed = parseMarkdownWithH1(raw)
                  metaDirty = true
                  return { ...chapter, wordCount: getWordCount(parsed.content) }
                })
                const volumeWordCount = updatedChapters.reduce((s, c) => s + (c.wordCount ?? 0), 0)
                return { ...volume, wordCount: volumeWordCount, chapters: updatedChapters }
              })
            } else {
              meta.chapters = (meta.chapters ?? []).map(chapter => {
                if (typeof chapter.wordCount === 'number') return chapter
                const mdPath = getChapterMarkdownPath(meta.type, meta.id, chapter.id)
                const raw = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf-8') : ''
                const parsed = parseMarkdownWithH1(raw)
                metaDirty = true
                return { ...chapter, wordCount: getWordCount(parsed.content) }
              })
            }
            if (metaDirty) {
              meta.wordCount = hasVolumes(meta.type)
                ? (meta.volumes ?? []).reduce(
                    (s, v) => s + (v.chapters ?? []).reduce((cs, c) => cs + (c.wordCount ?? 0), 0),
                    0,
                  )
                : (meta.chapters ?? []).reduce((s, c) => s + (c.wordCount ?? 0), 0)
              meta.chapterCount = hasVolumes(meta.type)
                ? (meta.volumes ?? []).reduce((s, v) => s + (v.chapters?.length ?? 0), 0)
                : (meta.chapters ?? []).length
              fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
              logger.info(`Migrated wordCount for writing ${meta.id}`)
            }
          }

          const metaChapterCount =
            typeof meta.chapterCount === 'number'
              ? meta.chapterCount
              : hasVolumes(meta.type)
                ? (meta.volumes ?? []).reduce((sum, volume) => sum + (volume.chapters?.length ?? 0), 0)
                : (meta.chapters ?? []).length

          const chapterSumWordCount = hasVolumes(meta.type)
            ? (meta.volumes ?? []).reduce(
                (sum, volume) =>
                  sum + (volume.chapters ?? []).reduce((cs, chapter) => cs + (chapter.wordCount ?? 0), 0),
                0,
              )
            : (meta.chapters ?? []).reduce((sum, chapter) => sum + (chapter.wordCount ?? 0), 0)

          const metaWordCount = chapterSumWordCount > 0 ? chapterSumWordCount : (meta.wordCount ?? 0)

          writings.push({
            id: meta.id,
            title: meta.title,
            description,
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt,
            tags: meta.tags,
            wordCount: metaWordCount,
            chapterCount: metaChapterCount,
          })
        } catch (error) {
          logger.error(`Failed to parse writing file ${metaPath}:`, error)
        }
      }
    }

    return writings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (error) {
    logger.error(`Failed to list writings for type ${type}:`, error)
    return []
  }
}

function deleteWriting(type: WritingType, id: string): boolean {
  try {
    if (type === 'article') {
      const metaPath = getArticleMetaPath(id)
      const markdownPath = getArticleMarkdownPath(id)
      if (fs.existsSync(metaPath)) {
        fs.unlinkSync(metaPath)
      }
      if (fs.existsSync(markdownPath)) {
        fs.unlinkSync(markdownPath)
      }
      logger.info(`Deleted writing: ${type}/${id}`)
      return true
    }

    const entryDir = getChapteredEntryDir(type, id)
    if (!fs.existsSync(entryDir)) {
      return false
    }

    removeDirRecursive(entryDir)
    logger.info(`Deleted writing: ${type}/${id}`)
    return true
  } catch (error) {
    logger.error(`Failed to delete writing ${id}:`, error)
    return false
  }
}

function loadChapterContent(
  type: WritingType,
  writingId: string,
  chapterId: string,
): { title: string; content: string } | null {
  if (!hasChapters(type)) {
    return null
  }

  const writing = loadWriting(type, writingId)
  if (!writing) {
    return null
  }

  if (hasVolumes(type)) {
    for (const volume of writing.volumes ?? []) {
      const chapter = (volume.chapters ?? []).find(item => item.id === chapterId)
      if (chapter) {
        return { title: chapter.title, content: chapter.content }
      }
    }
    return null
  }

  const chapter = (writing.chapters ?? []).find(item => item.id === chapterId)
  if (!chapter) {
    return null
  }

  return { title: chapter.title, content: chapter.content }
}

function saveChapterContent(
  type: WritingType,
  writingId: string,
  chapterId: string,
  payload: { title: string; content: string },
): boolean {
  if (!hasChapters(type)) {
    return false
  }

  const metaPath = getChapteredMetaPath(type, writingId)
  if (!fs.existsSync(metaPath)) {
    return false
  }

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as WritingItemMeta
    const nextWordCount = getWordCount(payload.content)

    let found = false
    if (hasVolumes(type)) {
      meta.volumes = (meta.volumes ?? []).map(volume => {
        const nextChapters = (volume.chapters ?? []).map(chapter => {
          if (chapter.id !== chapterId) {
            return chapter
          }

          found = true
          return {
            ...chapter,
            title: payload.title,
            wordCount: nextWordCount,
          }
        })

        const nextVolumeWordCount = nextChapters.reduce((sum, chapter) => sum + (chapter.wordCount ?? 0), 0)

        return {
          ...volume,
          wordCount: nextVolumeWordCount,
          chapters: nextChapters,
        }
      })
    } else {
      meta.chapters = (meta.chapters ?? []).map(chapter => {
        if (chapter.id !== chapterId) {
          return chapter
        }

        found = true
        return {
          ...chapter,
          title: payload.title,
          wordCount: nextWordCount,
        }
      })
    }

    if (!found) {
      return false
    }

    meta.wordCount = hasVolumes(type)
      ? (meta.volumes ?? []).reduce(
          (sum, volume) =>
            sum + (volume.chapters ?? []).reduce((chapterSum, chapter) => chapterSum + (chapter.wordCount ?? 0), 0),
          0,
        )
      : (meta.chapters ?? []).reduce((sum, chapter) => sum + (chapter.wordCount ?? 0), 0)

    meta.chapterCount = hasVolumes(type)
      ? (meta.volumes ?? []).reduce((sum, volume) => sum + (volume.chapters?.length ?? 0), 0)
      : (meta.chapters ?? []).length

    meta.updatedAt = new Date().toISOString()
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')

    const chapterPath = getChapterMarkdownPath(type, writingId, chapterId)
    writeMarkdownWithH1(chapterPath, payload.title, payload.content)

    return true
  } catch (error) {
    logger.error(`Failed to save chapter content ${writingId}/${chapterId}:`, error)
    return false
  }
}

// 导出所有写作数据
function exportWritingData(): WritingExportData {
  const types: WritingType[] = ['article', 'short_story', 'video_script', 'novel']
  const items: WritingItem[] = []

  for (const type of types) {
    const list = listWritings(type)
    for (const baseItem of list) {
      const writing = loadWriting(type, baseItem.id)
      if (writing) {
        items.push(writing)
      }
    }
  }

  return {
    items,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  }
}

// 导入写作数据
function importWritingData(data: WritingExportData): { success: number; failed: number } {
  let success = 0
  let failed = 0

  for (const item of data.items) {
    try {
      saveWriting({
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content,
        tags: item.tags,
        metadata: item.metadata,
        chapters: item.chapters,
        volumes: item.volumes,
      })
      success++
    } catch (error) {
      logger.error(`Failed to import writing ${item.id}:`, error)
      failed++
    }
  }

  logger.info(`Import completed: ${success} success, ${failed} failed`)
  return { success, failed }
}

// 注册IPC处理器
export function setupWritingHandler(): void {
  // 初始化目录
  ipcMain.handle(IPC_ACTIONS.WRITING_INIT_DIRECTORIES, () => {
    initWritingDirectories()
    return { success: true }
  })

  // 保存写作内容
  ipcMain.handle(IPC_ACTIONS.WRITING_SAVE, async (event, data: WritingSaveRequest) => {
    try {
      const id = await saveWriting(data)
      return { success: true, id }
    } catch (error) {
      logger.error('Failed to save writing:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 加载写作内容
  ipcMain.handle(IPC_ACTIONS.WRITING_LOAD, (event, type: WritingType, id: string) => {
    return loadWriting(type, id)
  })

  // 获取写作内容列表
  ipcMain.handle(IPC_ACTIONS.WRITING_LIST, (event, type: WritingType) => {
    return listWritings(type)
  })

  // 删除写作内容
  ipcMain.handle(IPC_ACTIONS.WRITING_DELETE, (event, type: WritingType, id: string) => {
    return deleteWriting(type, id)
  })

  // 导出数据
  ipcMain.handle(IPC_ACTIONS.WRITING_EXPORT_DATA, () => {
    return exportWritingData()
  })

  // 导入数据
  ipcMain.handle(IPC_ACTIONS.WRITING_IMPORT_DATA, (event, data: WritingExportData) => {
    return importWritingData(data)
  })

  ipcMain.handle(IPC_ACTIONS.WRITING_LOAD_CHAPTER, (event, type: WritingType, writingId: string, chapterId: string) => {
    return loadChapterContent(type, writingId, chapterId)
  })

  ipcMain.handle(
    IPC_ACTIONS.WRITING_SAVE_CHAPTER,
    (event, type: WritingType, writingId: string, chapterId: string, payload: { title: string; content: string }) => {
      return saveChapterContent(type, writingId, chapterId, payload)
    },
  )

  logger.info('Writing IPC handlers registered')
}
