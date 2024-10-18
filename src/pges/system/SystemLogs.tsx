import { Button } from 'antd'
import React, { useState } from 'react'
import './log.css'
const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

interface Props {}

type ErrorDisplayType = {
  level: string
  timestamp: string
  message?: string
}

const SystemLogs: React.FC<Props> = () => {
  const [logs, setLogs] = useState<ErrorDisplayType[]>([])
  const [errored, setErrored] = useState('')

  const getLogs = async () => {
    const result: any = await ipcRenderer?.invoke(IPC_ACTIONS.GET_LOGS, null)
    console.log('logs:::', result)

    if (result?.logs) {
      setLogs(result.logs)
      setErrored('')
    } else {
      setErrored(result?.error.toString())
    }
  }

  const logStyle = {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '5px',
    fontFamily: 'monospace',
  }

  return (
    <div
      style={{
        padding: '20px',
        height: 'calc(100% - 0px)',
        boxSizing: 'border-box',
        backgroundColor: '#2e2e2e',
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <Button onClick={getLogs} style={{ marginBottom: '10px' }}>
        Get Logs
      </Button>
      {errored ? (
        <div style={{ color: 'red' }}>{errored}</div>
      ) : (
        <>
          {/* <h3 style={{ color: '#ffffff' }}>Logs</h3> */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} style={logStyle}>
                  <span>[{log.level}] </span>
                  <span>{log.timestamp} - </span>
                  <span>{log.message}</span>
                </div>
              ))
            ) : (
              <div style={logStyle}>No logs available.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default SystemLogs
