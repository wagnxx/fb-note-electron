import { Collapse, CollapseProps, Flex, FormProps, Splitter, Switch, theme } from 'antd'
import React, { useState, useEffect } from 'react'
import SettingForm, { SettingFormFieldType } from './components/SettingForm'
import { isElectron } from '../../utils/utilsSystem'

// 通过 preload 暴露的安全 IPC API
const { ipcRenderer } = window.electron || {}

const { useToken } = theme

const stopPropagationHandler = (
  checked: boolean,
  event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
) => {
  event.stopPropagation()
}

const onFinishFailed: FormProps<SettingFormFieldType>['onFinishFailed'] = errorInfo => {
  console.log('Failed:', errorInfo)
}

const onFinishOfProxy: FormProps<SettingFormFieldType>['onFinish'] = values => {
  console.log('onFinishOfProxy:', values)
}

const onFinishOfSocks5: FormProps<SettingFormFieldType>['onFinish'] = values => {
  console.log('onFinishOfSocks5:', values)
  if (isElectron()) {
    ipcRenderer?.send('start-socks-service', { type: 'socks5', payload: values })
  } else {
    console.warn('This feature is not supported in the web environment.')
  }
}

export default function System() {
  const [proxySwitchChecked, setProxySwitchChecked] = useState(false)
  const [isSocksServerRunning, setIsSocksServerRunning] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])

  const { token } = useToken()

  useEffect(() => {
    const handleServiceOutput = (data: string) => {
      console.log('received message from ipc:', data)
      setConsoleOutput(prevOutput => [...prevOutput, data])
    }

    const handleServiceStatus = (status: { success: boolean; message: string }) => {
      const outputMessage = status.success
        ? `Socks service started successfully: ${status.message}`
        : `Failed to start socks service: ${status.message}`
      setConsoleOutput(prevOutput => [...prevOutput, outputMessage])
    }

    // 确保 ipcRenderer 事件监听器存在
    ipcRenderer.on('socks-service-output', handleServiceOutput)
    ipcRenderer.on('socks-service-error', handleServiceOutput)
    ipcRenderer.on('socks-service-stopped', handleServiceOutput)
    ipcRenderer.on('socks-service-status', handleServiceStatus) // 监听服务状态

    return () => {
      ipcRenderer.removeListener('socks-service-output', handleServiceOutput)
      ipcRenderer.removeListener('socks-service-error', handleServiceOutput)
      ipcRenderer.removeListener('socks-service-stopped', handleServiceOutput)
      ipcRenderer.removeListener('socks-service-status', handleServiceStatus) // 移除服务状态监听器
    }
  }, [])

  useEffect(() => {
    const checkServiceStatus = async () => {
      if (isElectron()) {
        const isRunning = await ipcRenderer?.invoke('check-socks-service', null)
        console.log('Is SOCKS service running:', isRunning)
        // 处理服务状态，比如更新 UI 或状态
        if (typeof isRunning === 'boolean') {
          setIsSocksServerRunning(isRunning)
        }
      }
    }

    checkServiceStatus()
  }, [])

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: 'Proxy',
      children: (
        <SettingForm
          onFinish={onFinishOfProxy}
          onFinishFailed={onFinishFailed}
          disabled={!proxySwitchChecked}
        />
      ),
      extra: (
        <Switch
          disabled
          checked={proxySwitchChecked}
          onChange={val => setProxySwitchChecked(val)}
          onClick={stopPropagationHandler}
        />
      ),
    },
    {
      key: '2',
      label: 'Socks5',
      children: <SettingForm onFinish={onFinishOfSocks5} onFinishFailed={onFinishFailed} />,
      extra: (
        <Switch
          disabled
          checked={isSocksServerRunning}
          // onChange={val => setSocks5SwitchChecked(val)}
          onClick={stopPropagationHandler}
        />
      ),
    },
  ]

  return (
    <Flex className="overflow-y-auto" style={{ height: 'inherit' }}>
      <Splitter style={{ height: '100%', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        <Splitter.Panel defaultSize="40%" min="20%" max="70%">
          <Collapse items={items} />
        </Splitter.Panel>
        <Splitter.Panel>
          <h3
            style={{
              background: token.colorBgElevated,
              color: token.colorTextHeading,
              padding: '8px',
            }}
          >
            Console Output:
          </h3>
          <div
            style={{
              backgroundColor: token.colorBgSolid,
              padding: token.padding,
              color: token.colorTextLightSolid,
              fontSize: token.fontSize,
              height: 'calc(100% - 40px)',
              overflowY: 'scroll',
            }}
          >
            <pre>{consoleOutput.length > 0 ? consoleOutput.join('\n') : 'No output yet.'}</pre>
          </div>
        </Splitter.Panel>
      </Splitter>
    </Flex>
  )
}
