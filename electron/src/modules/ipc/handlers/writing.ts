import path from 'path'
import fs from 'fs'
import { ipcMain } from 'electron'
import { logger } from '@/utils/logger'
import { getSupportPath } from '@/config/basic'
import { IPC_ACTIONS } from '@shared/ipcActions'
import type { WritingItem, WritingType, WritingBase, WritingExportData } from '@shared/types/writing'

// 获取写作目录路径
function getWritingDir(): string {
  return getSupportPath('writing')
}

// 获取特定类型的写作目录
function getWritingTypeDir(type: WritingType): string {
  return path.join(getWritingDir(), type)
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
async function saveWriting(data: Omit<WritingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const typeDir = getWritingTypeDir(data.type)
  ensureDir(typeDir)

  const id = generateId()
  const now = new Date().toISOString()

  const writingItem: WritingItem = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  }

  const filePath = path.join(typeDir, `${id}.json`)
  fs.writeFileSync(filePath, JSON.stringify(writingItem, null, 2), 'utf-8')

  logger.info(`Saved writing: ${data.title} (${id})`)
  return id
}

// 加载写作内容
function loadWriting(type: WritingType, id: string): WritingItem | null {
  const filePath = path.join(getWritingTypeDir(type), `${id}.json`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as WritingItem
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
    const files = fs
      .readdirSync(typeDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(typeDir, file))

    const writings: WritingBase[] = []

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const writing: WritingItem = JSON.parse(content)
        writings.push({
          id: writing.id,
          title: writing.title,
          createdAt: writing.createdAt,
          updatedAt: writing.updatedAt,
          tags: writing.tags,
        })
      } catch (error) {
        logger.error(`Failed to parse writing file ${filePath}:`, error)
      }
    }

    // 按更新时间倒序排序
    return writings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (error) {
    logger.error(`Failed to list writings for type ${type}:`, error)
    return []
  }
}

// 删除写作内容
function deleteWriting(type: WritingType, id: string): boolean {
  const filePath = path.join(getWritingTypeDir(type), `${id}.json`)

  if (!fs.existsSync(filePath)) {
    return false
  }

  try {
    fs.unlinkSync(filePath)
    logger.info(`Deleted writing: ${type}/${id}`)
    return true
  } catch (error) {
    logger.error(`Failed to delete writing ${id}:`, error)
    return false
  }
}

// 导出所有写作数据
function exportWritingData(): WritingExportData {
  const types: WritingType[] = ['article', 'short_story', 'video_script', 'novel']
  const items: WritingItem[] = []

  for (const type of types) {
    const typeDir = getWritingTypeDir(type)
    if (!fs.existsSync(typeDir)) continue

    const files = fs
      .readdirSync(typeDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(typeDir, file))

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const writing: WritingItem = JSON.parse(content)
        items.push(writing)
      } catch (error) {
        logger.error(`Failed to export writing file ${filePath}:`, error)
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
      const typeDir = getWritingTypeDir(item.type)
      ensureDir(typeDir)

      const filePath = path.join(typeDir, `${item.id}.json`)
      fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf-8')
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
  ipcMain.handle(IPC_ACTIONS.WRITING_SAVE, async (event, data: Omit<WritingItem, 'id' | 'createdAt' | 'updatedAt'>) => {
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

  logger.info('Writing IPC handlers registered')
}
