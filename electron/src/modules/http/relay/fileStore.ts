import { getSupportPath } from '@/config'
import { ensureDirectoryExists, fileExists, writeFile } from '@/utils/fileManager'
import fs from 'fs'
import path from 'path'

export type RelayStoredFile = {
  id: string
  fileName: string
  fileType: string
  size: number
  storagePath: string
  createdAt: number
  uploadedBy?: string
}

const RELAY_FILES_DIR = getSupportPath('download', 'relay-files')

class RelayFileStore {
  private readonly fileMap = new Map<string, RelayStoredFile>()

  private sanitizeFileName(fileName: string) {
    const trimmed = fileName.trim() || 'unnamed-file'
    return trimmed.replace(/[\\/:*?"<>|]/g, '_')
  }

  private genId() {
    return `relay_file_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }

  public async saveBuffer(params: {
    fileName: string
    fileType: string
    buffer: Buffer
    uploadedBy?: string
  }): Promise<RelayStoredFile> {
    await ensureDirectoryExists(RELAY_FILES_DIR)

    const id = this.genId()
    const safeName = this.sanitizeFileName(params.fileName)
    const ext = path.extname(safeName)
    const fileNameNoExt = ext ? safeName.slice(0, -ext.length) : safeName
    const finalFileName = `${fileNameNoExt}_${id}${ext}`
    const storagePath = path.join(RELAY_FILES_DIR, finalFileName)

    await writeFile(storagePath, params.buffer)

    const record: RelayStoredFile = {
      id,
      fileName: safeName,
      fileType: params.fileType,
      size: params.buffer.length,
      storagePath,
      createdAt: Date.now(),
      uploadedBy: params.uploadedBy,
    }

    this.fileMap.set(id, record)
    return record
  }

  public async getFile(fileId: string): Promise<RelayStoredFile | null> {
    const file = this.fileMap.get(fileId)
    if (!file) return null

    const exists = await fileExists(file.storagePath)
    if (!exists) {
      this.fileMap.delete(fileId)
      return null
    }

    return file
  }

  public async deleteFile(fileId: string): Promise<boolean> {
    const file = await this.getFile(fileId)
    if (!file) return false

    try {
      fs.unlinkSync(file.storagePath)
    } catch {
      return false
    }

    this.fileMap.delete(fileId)
    return true
  }
}

export const relayFileStore = new RelayFileStore()
