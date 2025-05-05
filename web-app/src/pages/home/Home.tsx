import React, { useMemo, useState } from 'react'
import PageLayout, { MenuItem } from '../../components/layout/PageLayut'
import System from '../system/System'
import { Empty, Flex } from 'antd'
import { isElectron } from '../../utils/utilsSystem'
import SystemLogs from '../system/SystemLogs'
import { findItemFromArrayByKey } from '../../utils/utilsArray'

const EmptyPage = () => (
  <Flex justify="center" align="center" style={{ height: '100vh' }}>
    <Empty description={'The web platform cannot be supported.'} />
  </Flex>
)
// 配置菜单
const menuConfig: MenuItem[] = [
  {
    key: 'System',
    label: 'System',
    children: [
      {
        key: 'System-Proxies',
        label: 'System Proxies',
        component: isElectron() ? System : EmptyPage, // 根据环境选择组件
      },
      {
        key: 'System-Logs',
        label: 'System Logs',
        component: isElectron() ? SystemLogs : EmptyPage, // 根据环境选择组件
      },
    ],
  },
]

export default function Home() {
  const [componentKey, setComponentKey] = useState<string>('System-Proxies')

  // 根据当前选中的组件键查找组件
  const CurrentComponent = useMemo(() => {
    const item = findItemFromArrayByKey(menuConfig, componentKey)
    return item?.component
  }, [componentKey])

  // 处理菜单项选择
  const onMenuItemSelectedHandler = (info: MenuItem) => {
    setComponentKey(info.key)
  }

  return (
    <PageLayout menu={menuConfig} onMenuItemSelected={onMenuItemSelectedHandler}>
      {CurrentComponent && <CurrentComponent />}
    </PageLayout>
  )
}
