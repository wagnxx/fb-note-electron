import fs from 'fs'
import path from 'path'
import { ipcMain, shell } from 'electron'
import { logger } from '@/utils/logger'
import { getSupportPath } from '@/config/basic'
import { IPC_ACTIONS } from '@shared/ipcActions'

const CONFIG_FILE = getSupportPath('app-settings.json')

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
  try {
    await fs.promises.mkdir(path.dirname(CONFIG_FILE), { recursive: true })
    await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(cfg || {}, null, 2), 'utf-8')
  } catch (e) {
    logger.warn('[settings] failed to write config', e)
  }
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
}
