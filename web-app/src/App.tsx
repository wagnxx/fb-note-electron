import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { ConfigProvider, notification, App as AntdApp } from 'antd'
import type { ThemeConfig } from 'antd'
import { Provider } from 'react-redux'
import { store, persistor } from '@/store/store' // 确保你导入了 Redux store
import AppRoutes from './routes/AppRoutes'
import './App.css'
import i18n from './i18n'
import { Spin } from 'antd'
import { useEffect, useState } from 'react'

const config: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 2,

    // 派生变量，影响范围小
    // colorBgContainer: '#f6ffed',
  },
  components: {
    List: {},
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
          <AntdApp>
            <div className="app-root">
              <AppContent />
            </div>
          </AntdApp>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  )
}

const AppContent: React.FC = () => {
  const [ready, setReady] = useState<boolean>(i18n.isInitialized ?? false)

  useEffect(() => {
    if (i18n.isInitialized) {
      setReady(true)
      return
    }
    const onInit = () => setReady(true)
    i18n.on && i18n.on('initialized', onInit)
    return () => {
      i18n.off && i18n.off('initialized', onInit)
    }
  }, [])

  // In dev, print loaded resource summary to help debugging missing keys
  useEffect(() => {
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV === 'development') {
      try {
        // i18n.store?.data structure: { en: { translation: { ... } } }
        // Print languages and namespaces loaded
        // eslint-disable-next-line no-console
        console.debug('i18n initialized:', i18n.isInitialized)
        // eslint-disable-next-line no-console
        console.debug(
          'i18n store snapshot:',
          Object.keys((i18n as any).store?.data || {}).map(lng => ({
            lng,
            namespaces: Object.keys(((i18n as any).store?.data || {})[lng] || {}),
          })),
        )
      } catch (e) {
        // ignore
      }
    }
  }, [ready])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <AppRoutes />
    </React.Suspense>
  )
}

export default App
