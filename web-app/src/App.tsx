import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { ConfigProvider, notification } from 'antd'
import type { ThemeConfig } from 'antd'
import { Provider } from 'react-redux'
import { store, persistor } from '@/store/store' // 确保你导入了 Redux store
import AppRoutes from './routes/AppRoutes'
import './App.css'
import './i18n'

const config: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
  },
}

const App: React.FC = () => {
  // 配置 notification 的全局行为
  notification.config({
    placement: 'topRight', // 配置通知显示位置
    duration: 4, // 配置通知显示时长
    bottom: 50, // 配置底部距离
    rtl: false, // 配置是否启用右到左显示
  })

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider theme={config}>
          <div className="app-root">
            <AppRoutes />
          </div>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  )
}

export default App
