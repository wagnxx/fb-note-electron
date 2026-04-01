import fs from 'fs'
import path from 'path'
import { ipcMain, shell } from 'electron'
import { logger } from '@/utils/logger'
import { getSupportPath, getDistPath, isDev } from '@/config/basic'
import { IPC_ACTIONS } from '@shared/ipcActions'

const CONFIG_FILE = getSupportPath('app-settings.json')
const CONFIG_BACKUP_FILE = `${CONFIG_FILE}.bak`
const CONFIG_TMP_FILE = `${CONFIG_FILE}.tmp`

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    logger.info(`[settings] created dir: ${dirPath}`)
  }
}

async function readConfig(): Promise<any> {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return {}
    const raw = await fs.promises.readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    logger.warn('[settings] failed to read config', e)
    return {}
  }
}

async function writeConfig(cfg: any) {
  await fs.promises.mkdir(path.dirname(CONFIG_FILE), { recursive: true })

  const nextContent = JSON.stringify(cfg || {}, null, 2)
  const hasOldConfig = fs.existsSync(CONFIG_FILE)

  try {
    if (hasOldConfig) {
      await fs.promises.copyFile(CONFIG_FILE, CONFIG_BACKUP_FILE)
    }

    await fs.promises.writeFile(CONFIG_TMP_FILE, nextContent, 'utf-8')

    try {
      JSON.parse(await fs.promises.readFile(CONFIG_TMP_FILE, 'utf-8'))
    } catch (parseErr) {
      throw new Error(`tmp_config_invalid_json: ${String(parseErr)}`)
    }

    await fs.promises.rename(CONFIG_TMP_FILE, CONFIG_FILE)
  } catch (e) {
    logger.warn('[settings] failed to write config, trying rollback', e)
    try {
      if (fs.existsSync(CONFIG_TMP_FILE)) {
        await fs.promises.rm(CONFIG_TMP_FILE, { force: true })
      }
      if (fs.existsSync(CONFIG_BACKUP_FILE)) {
        await fs.promises.copyFile(CONFIG_BACKUP_FILE, CONFIG_FILE)
      }
    } catch (rollbackErr) {
      logger.warn('[settings] rollback failed', rollbackErr)
    }
    throw e
  }
}

function mergeDeep<T extends Record<string, any>>(target: T, patch: Partial<T>): T {
  const output: Record<string, any> = Array.isArray(target) ? [...target] : { ...(target || {}) }
  for (const key of Object.keys(patch || {})) {
    const patchValue: any = (patch as any)[key]
    const currentValue: any = (output as any)[key]
    if (
      patchValue &&
      typeof patchValue === 'object' &&
      !Array.isArray(patchValue) &&
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue)
    ) {
      output[key] = mergeDeep(currentValue, patchValue)
    } else {
      output[key] = patchValue
    }
  }
  return output as T
}

async function copyDir(src: string, dest: string) {
  const entries = await fs.promises.readdir(src, { withFileTypes: true })
  await fs.promises.mkdir(dest, { recursive: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}

async function safeCountFiles(dir: string, limit = 2000): Promise<number> {
  let count = 0
  async function walk(p: string) {
    try {
      const entries = await fs.promises.readdir(p, { withFileTypes: true })
      for (const e of entries) {
        if (count > limit) return
        const child = path.join(p, e.name)
        if (e.isDirectory()) {
          await walk(child)
        } else if (e.isFile()) {
          count += 1
          if (count > limit) return
        }
      }
    } catch {
      // ignore errors while counting
    }
  }
  await walk(dir)
  return count
}

export function setupSettingsHandler() {
  ipcMain.handle(IPC_ACTIONS.GET_SETTINGS_DIR, async () => {
    try {
      const cfg = await readConfig()
      const envPath = process.env.SETTINGS_DIR
      const dir = envPath || cfg.settingsDir || getSupportPath('writing')
      ensureDir(dir)
      return dir
    } catch (e) {
      logger.warn('[settings] GET_SETTINGS_DIR failed', e)
      return null
    }
  })

  ipcMain.handle(IPC_ACTIONS.SET_SETTINGS_DIR, async (_event, newDir: string) => {
    try {
      // disallow choosing project root as storage (except default support dir)
      const projectRoot = path.resolve(getDistPath(), isDev ? '..' : '../..')
      const supportDir = path.resolve(getSupportPath())
      const normalizedNew = path.resolve(newDir)
      if (normalizedNew === projectRoot && normalizedNew !== supportDir) {
        return { ok: false, error: 'Selected directory cannot be the project root' }
      }

      ensureDir(newDir)
      const cfg = await readConfig()
      cfg.settingsDir = newDir
      await writeConfig(cfg)
      return { ok: true }
    } catch (e) {
      logger.warn('[settings] SET_SETTINGS_DIR failed', e)
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle(
    IPC_ACTIONS.MIGRATE_SETTINGS,
    async (_event, newDir: string, options: { migrate?: boolean } = { migrate: true }) => {
      try {
        const cfg = await readConfig()
        const oldDir = cfg.settingsDir || getSupportPath('writing')
        // prevent migrating into project root
        const projectRoot = path.resolve(getDistPath(), isDev ? '..' : '../..')
        const supportDir = path.resolve(getSupportPath())
        const normalizedNew = path.resolve(newDir)
        if (normalizedNew === projectRoot && normalizedNew !== supportDir) {
          return { ok: false, error: 'Selected directory cannot be the project root' }
        }
        if (!fs.existsSync(oldDir)) {
          // nothing to migrate
          ensureDir(newDir)
          cfg.settingsDir = newDir
          await writeConfig(cfg)
          return { ok: true, migrated: false }
        }

        ensureDir(newDir)

        if (options.migrate) {
          // copy then remove old
          await copyDir(oldDir, newDir)
          try {
            await fs.promises.rm(oldDir, { recursive: true, force: true })
          } catch (e) {
            logger.warn('[settings] failed to remove old dir after migrate', e)
          }
        }

        cfg.settingsDir = newDir
        await writeConfig(cfg)
        return { ok: true, migrated: !!options.migrate }
      } catch (e) {
        logger.warn('[settings] MIGRATE_SETTINGS failed', e)
        return { ok: false, error: String(e) }
      }
    },
  )

  // Validate a directory: exists, isDirectory, writable, fileCount, isEmpty
  ipcMain.handle(IPC_ACTIONS.VALIDATE_DIR, async (_event, targetDir: string) => {
    try {
      if (!targetDir) return { exists: false, isDirectory: false, writable: false, fileCount: 0, isEmpty: true }
      const exists = fs.existsSync(targetDir)
      // disallow project root selection (except default support dir)
      const projectRoot = path.resolve(getDistPath(), isDev ? '..' : '../..')
      const supportDir = path.resolve(getSupportPath())
      const normalizedTarget = path.resolve(targetDir)
      if (normalizedTarget === projectRoot && normalizedTarget !== supportDir) {
        return {
          exists: true,
          isDirectory: true,
          writable: false,
          fileCount: 0,
          isEmpty: true,
          error: 'forbidden_project_root',
        }
      }
      if (!exists) return { exists: false, isDirectory: false, writable: true, fileCount: 0, isEmpty: true }
      const stat = fs.statSync(targetDir)
      const isDirectory = stat.isDirectory()
      if (!isDirectory) return { exists: true, isDirectory: false, writable: false, fileCount: 0, isEmpty: false }

      let writable = true
      try {
        fs.accessSync(targetDir, fs.constants.W_OK)
      } catch (e) {
        writable = false
      }

      const fileCount = await safeCountFiles(targetDir, 2000)
      const isEmpty = fileCount === 0
      return { exists: true, isDirectory: true, writable, fileCount, isEmpty }
    } catch (err) {
      logger.warn('[settings] VALIDATE_DIR failed', err)
      return { exists: false, isDirectory: false, writable: false, fileCount: 0, isEmpty: true, error: String(err) }
    }
  })

  ipcMain.handle(IPC_ACTIONS.OPEN_SETTINGS_DIR, async () => {
    try {
      const cfg = await readConfig()
      const dir = cfg.settingsDir || getSupportPath('writing')
      ensureDir(dir)
      await shell.openPath(dir)
      return { ok: true }
    } catch (e) {
      logger.warn('[settings] OPEN_SETTINGS_DIR failed', e)
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC_ACTIONS.GET_APP_SETTINGS, async () => {
    try {
      const cfg = await readConfig()
      return cfg || {}
    } catch (e) {
      logger.warn('[settings] GET_APP_SETTINGS failed', e)
      return {}
    }
  })

  ipcMain.handle(IPC_ACTIONS.PATCH_APP_SETTINGS, async (_event, patch: Record<string, any>) => {
    try {
      const cfg = await readConfig()
      const nextCfg = mergeDeep(cfg || {}, patch || {})
      await writeConfig(nextCfg)
      return { ok: true, settings: nextCfg }
    } catch (e) {
      logger.warn('[settings] PATCH_APP_SETTINGS failed', e)
      return { ok: false, error: String(e) }
    }
  })
}

// Synchronous getter for other main-process modules to obtain the configured settings directory.
export function getConfiguredSettingsDirSync(): string {
  try {
    const envPath = process.env.SETTINGS_DIR
    if (envPath) return envPath

    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
        const cfg = JSON.parse(raw || '{}')
        if (cfg.settingsDir) return cfg.settingsDir
      } catch {
        // fallthrough to default
      }
    }
  } catch {
    // ignore
  }

  const dir = getSupportPath('writing')
  ensureDir(dir)
  return dir
}
