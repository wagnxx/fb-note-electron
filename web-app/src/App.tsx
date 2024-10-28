import React from 'react'
import { ConfigProvider } from 'antd'
import { BrowserRouter as Router } from 'react-router-dom'
import type { ThemeConfig } from 'antd'
import { Provider } from 'react-redux'
import store from '@/store/store' // 确保你导入了 Redux store
import AuthLayout from './routes/AuthLayout'
import { AuthProvider } from './context/AuthContext'

const config: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
  },
}

const App: React.FC = () => (
  <Provider store={store}>
    <ConfigProvider theme={config}>
      <AuthProvider>
        <Router>
          <AuthLayout />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  </Provider>
)

export default App
