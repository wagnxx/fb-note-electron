import path from 'path'
import fs from 'fs'
import { ipcMain } from 'electron'
import { IPC_ACTIONS } from '@/constants'
import { ChildProcess, exec, spawn } from 'child_process'
import { IpcMainEvent } from 'electron'
import { isDev, infoFile, LOG_FILE_PATH, pidFile, SOCKS_RELATIVE_PATH } from '@/config'
import { logger } from '@/utils/logger'
import { getNetworkInfo } from '@/utils/netUtils'

let socksProcess: ChildProcess | null = null
export const setupSocksHandler = () => {
  // 启动 SOCKS 服务
  ipcMain.on(
    IPC_ACTIONS.START_SOCKS_SERVICE,
    (
      event: IpcMainEvent,
      {
        payload: { address, port },
        action = null,
      }: { payload: { address: string; port: number }; action?: string | null },
    ) => {
      try {
        if (!socksProcess) {
          console.log('address, port', address, port)

          socksProcess = isDev
            ? spawn('node', [path.join(__dirname, SOCKS_RELATIVE_PATH), address, port.toString()])
            : spawn(path.join(__dirname, SOCKS_RELATIVE_PATH), [address, port.toString()])

          socksProcess.stdout?.on('data', data => {
            const output = data.toString()
            console.log(`SOCKS 服务输出: ${output}`)
            event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, output)

            try {
              const parsedData = JSON.parse(output)
              console.log('parsedData:::', parsedData)
              if (parsedData?.type === 'write_pid_to_temp') {
                event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 启动成功', action)
                const { host, port, pid } = parsedData
                fs.writeFileSync(pidFile, pid)
                fs.writeFileSync(infoFile, JSON.stringify({ host, port }))
              }
            } catch (error) {
              console.log('parse output error::', error)
            }
          })

          socksProcess.stderr?.on('data', data => {
            console.error(`SOCKS 服务错误: ${data}`)
            logger.error(data.toString())
            event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, data.toString())
          })

          socksProcess.on('close', code => {
            console.log(`SOCKS 服务已停止，退出码: ${code}`)
            socksProcess = null
            event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_STOPPED, `SOCKS 服务已停止，退出码: ${code}`)
          })

          console.log('SOCKS 服务已启动')
        } else {
          console.log('SOCKS 服务已经在运行')
          event.sender.send(
            IPC_ACTIONS.SOCKS_SERVICE_OUTPUT,
            'SOCKS 服务已经在运行 pid:' + socksProcess?.pid?.toString(),
          )
        }
      } catch (error) {
        logger.error(error)
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_ERROR, '启动服务时发生错误')
      }
    },
  )

  // 监听停止服务的请求
  ipcMain.on(IPC_ACTIONS.STOP_SOCKS_SERVICE, (event: IpcMainEvent, { action = null }: { action?: string | null }) => {
    if (socksProcess) {
      socksProcess.on('exit', () => {
        console.log('SOCKS 服务已停止')
        event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 服务已停止', action)
      })
      socksProcess.kill()
      socksProcess = null
    } else {
      console.log('SOCKS 服务未运行')
      event.sender.send(IPC_ACTIONS.SOCKS_SERVICE_OUTPUT, 'SOCKS 服务未运行', action)
    }
  })

  ipcMain.handle(IPC_ACTIONS.GET_SOCKS_SERVICE_INFO, async () => {
    return await getSocksServiceInfo()
  })
  ipcMain.handle(IPC_ACTIONS.CHECK_SOCKS_SERVICE, async () => {
    const serviceName = `node ${SOCKS_RELATIVE_PATH}`
    return await checkService(serviceName)
  })
  ipcMain.handle(IPC_ACTIONS.GET_LOGS, async () => {
    return await getLogs()
  })
  ipcMain.handle(IPC_ACTIONS.GET_WIFI, async () => {
    const { ip } = await getNetworkInfo()
    return ip
  })

  return {
    socksProcess,
  }
}

/**
 * 检查指定服务是否正在运行
 * @param {string} serviceName -
 * @returns {Promise<boolean>} - 返回一个 Promise，表示服务是否在运行
 */
function checkService(serviceName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(`pgrep -f ${serviceName}`, (error, stdout) => {
      if (error) {
        return reject(error)
      }
      const isRunning = stdout.trim() !== ''
      resolve(isRunning)
    })
  })
}

function getLogs() {
  try {
    const data = fs.readFileSync(LOG_FILE_PATH, 'utf-8')
    const lines = data.split('\n').filter(line => line.trim())
    const logs = lines.map(line => {
      try {
        return JSON.parse(line)
      } catch (parseErr) {
        return { error: `无法解析日志行: ${(parseErr as Error).message}`, line }
      }
    })
    return { logs }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

function getSocksServiceInfo() {
  const data = {
    host: '',
    port: '',
    isRunning: false,
    message: '',
  }

  try {
    const jsonData = fs.readFileSync(infoFile, 'utf-8')
    const parsedData = JSON.parse(jsonData)
    data.host = parsedData.host
    data.port = parsedData.port
  } catch (error) {
    logger.error(`Failed to read or parse ${infoFile}: ${(error as Error).message}`)
  }

  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'), 10)

    try {
      process.kill(pid, 0) // 检查进程是否仍然存在
      data.isRunning = true
    } catch (err) {
      const message = `Process with PID ${pid} is not running.`
      logger.error(message, err)
      data.isRunning = false
      data.message = message
    }
  } else {
    data.message = 'No PID file found.'
  }

  return data
}
