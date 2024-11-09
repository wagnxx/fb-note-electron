import React from 'react'
import { ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import { Provider } from 'react-redux'
import store from '@/store/store' // 确保你导入了 Redux store
import AppRoutes from './routes/AppRoutes'
import './App.css'
import { LeftOutlined } from '@ant-design/icons'

const config: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
  },
}

const App: React.FC = () => (
  <Provider store={store}>
    <ConfigProvider theme={config}>
      <div className="app-root">
        <div className="app-header">
          <LeftOutlined />
        </div>
        <AppRoutes />
      </div>
    </ConfigProvider>
  </Provider>
)

export default App
