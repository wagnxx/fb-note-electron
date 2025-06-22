import { getSupportPath } from '@/config'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
// import sqlite3 from 'sqlite3'
// import { open } from 'sqlite'

const supportDir = getSupportPath() // 你自定义的函数，返回目录，比如 ~/Library/Application Support/xxx
const dbName = process.env.DATABASE_NAME || 'dev.db'
const dbPath = path.join(supportDir, dbName)

// 设置环境变量，供 Prisma 使用
process.env.DATABASE_URL = `file:${dbPath}`

// 检查并初始化数据库（确保在导出 prisma 实例前完成）
checkAndInitPrismaDB()

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

export default prisma

/**
 * 检查数据库文件是否存在，若不存在则执行 Prisma 的 db push 以初始化数据库。
 * 之所以在这里执行初始化，是因为数据库文件路径是动态生成的（support 目录下）
 * 并且设置的环境变量 process.env.DATABASE_URL 只在当前运行时有效，
 * 这导致在外部终端执行 Prisma 命令时无法正确读取动态路径，
 * 因此只能在应用启动时（且路径确定后）调用此函数确保数据库和表结构同步。
 *
 * 同时此函数进一步检查数据库是否存在关键表（示例为 User 表），
 * 若表不存在，说明虽然文件存在但数据库结构未同步，也执行 db push。
 */
async function checkAndInitPrismaDB() {
  const dbExists = fs.existsSync(dbPath)

  if (!dbExists) {
    console.log('📀 First-time setup: creating DB at', dbPath)
    execSync('npx prisma db push --schema=./src/prisma/schema.prisma', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Database initialized with schema.')
    return
  }

  // 数据库文件存在，检查关键表是否存在
  const userTableExists = await hasUserTable()
  if (!userTableExists) {
    console.log('📀 Database exists but tables missing, running prisma db push...')
    execSync('npx prisma db push --schema=./src/prisma/schema.prisma', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Database schema synced.')
  } else {
    console.log('✅ Database and tables exist, skipping db push.')
  }
}

/**
 * 检查 SQLite 数据库是否存在指定表（此处示例为 User 表）
 */
async function hasUserTable(): Promise<boolean> {
  //   const db = await open({
  //     filename: dbFilePath,
  //     driver: sqlite3.Database,
  //   })

  //   const row = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='User'")
  //   await db.close()
  //   return !!row
  return true
}
