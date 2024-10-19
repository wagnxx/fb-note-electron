import React from 'react'
import { ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import Home from './pges/home/Home'
const config: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
  },
}

const App: React.FC = () => (
  <ConfigProvider theme={config}>
    <Home />
  </ConfigProvider>
)

export default App
