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
  const [socks5SwitchChecked, setSocks5SwitchChecked] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])

  const { token } = useToken()

  useEffect(() => {
    const handleServiceOutput = (data: string) => {
      console.log('received message from ipc:', data)
      setConsoleOutput(prevOutput => [...prevOutput, data])
    }

    // 确保 ipcRenderer 事件监听器存在
    ipcRenderer.on('socks-service-output', handleServiceOutput)
    ipcRenderer.on('socks-service-error', handleServiceOutput)
    ipcRenderer.on('socks-service-stopped', handleServiceOutput)

    return () => {
      ipcRenderer.removeListener('socks-service-output', handleServiceOutput)
      ipcRenderer.removeListener('socks-service-error', handleServiceOutput)
      ipcRenderer.removeListener('socks-service-stopped', handleServiceOutput)
    }
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
      children: (
        <SettingForm
          onFinish={onFinishOfSocks5}
          onFinishFailed={onFinishFailed}
          // disabled={!socks5SwitchChecked}
        />
      ),
      extra: (
        <Switch
          disabled
          checked={socks5SwitchChecked}
          onChange={val => setSocks5SwitchChecked(val)}
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
              // borderRadius: token.borderRadius,
              color: token.colorTextLightSolid,
              fontSize: token.fontSize,
              // backgroundColor: '#f5f5f5',
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
