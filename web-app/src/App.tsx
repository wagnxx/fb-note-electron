import React from 'react'
import { ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import AppRoutes from '@/routes/AppRoutes'
const config: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
  },
}

const App: React.FC = () => (
  <ConfigProvider theme={config}>
    <AppRoutes />
  </ConfigProvider>
)

export default App
