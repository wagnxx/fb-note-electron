import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

type HotReloadOptions = {
  include?: string[]
  exclude?: string[]
  onReload?: (mod: any, filePath: string) => void
}

class HotModuleReloader {
  private rootDir: string
  private extensions = ['.js', '.cjs', '.mjs'] // 支持的文件扩展名
  private include: string[]
  private exclude: string[]
  private onReload?: (mod: any, filePath: string) => void
  private loadedModules: Set<string> = new Set() // 追踪已加载模块

  constructor(rootDir: string, options: HotReloadOptions = {}) {
    this.rootDir = rootDir
    this.include = options.include?.map(p => path.resolve(rootDir, p)) || [rootDir]
    this.exclude = options.exclude?.map(p => path.resolve(rootDir, p)) || []
    this.onReload = options.onReload

    // 自动排除 HotModuleReloader 本身
    const hotModuleReloaderPath = path.resolve(__dirname, 'HotModuleReloader.js')
    if (!this.exclude.includes(hotModuleReloaderPath)) {
      this.exclude.push(hotModuleReloaderPath)
    }
  }

  public init() {
    this.include.forEach(dir => {
      const allModules = this.getAllModules(dir)
      allModules.forEach(modulePath => this.watchModule(modulePath))
    })

    console.log(chalk.green('[HMR] ') + chalk.cyan('Hot Module Reloading initialized.'))
  }

  private isExcluded(filePath: string): boolean {
    return this.exclude.some(ex => filePath.startsWith(ex))
  }

  private getAllModules(dir: string): string[] {
    let results: string[] = []

    const list = fs.readdirSync(dir)
    list.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      // 递归查找目录下的文件
      if (stat && stat.isDirectory()) {
        results = results.concat(this.getAllModules(filePath))
      } else if (
        this.extensions.includes(path.extname(file)) && // 检查文件扩展名是否符合
        !this.isExcluded(filePath) // 排除已排除的文件
      ) {
        results.push(filePath)
      }
    })

    return results
  }

  private watchModule(filePath: string) {
    fs.watchFile(filePath, { interval: 500 }, () => {
      try {
        // 解决路径，防止因缓存路径不同导致的重复加载
        const resolvedPath = require.resolve(filePath)
        delete require.cache[resolvedPath] // 删除缓存
        const mod = require(resolvedPath) // 重新加载模块

        // 如果是首次加载，则不执行 onReload 通知
        if (!this.loadedModules.has(filePath)) {
          this.loadedModules.add(filePath) // 标记为已加载
        } else {
          console.log(chalk.green('[HMR] 🔁 Reloaded module: ') + chalk.cyan(path.relative(this.rootDir, filePath)))
          if (this.onReload) {
            this.onReload(mod, filePath)
          }
        }
      } catch (err) {
        console.log(chalk.green('HMR] ❌  ') + chalk.red(`Failed to reload module: ${filePath}`), err)
      }
    })
  }
}

export default HotModuleReloader
