import React, { useMemo, useState } from 'react'
import PageLayout, { MenuItem } from '../../components/layout/PageLayut'
import System from '../system/System'


const menuConfig =  [
    {
        key: 'System',
        label: 'System',
        component: System
    },
]


export default function Home() {
    const [componentKey, setComponentKey] = useState<string>()

    const CurrentComponent = useMemo(() => {
        if (!componentKey) return null
        const foundItem = menuConfig.find(item => item.key === componentKey)
        return foundItem ? foundItem.component : null // 返回组件类型
    }, [componentKey])


const onMenuItemSelectedHandler = (info: MenuItem) => {
    setComponentKey(info.key)
}


  return (
       <PageLayout menu={menuConfig} onMenuItemSelected={onMenuItemSelectedHandler}>
         {CurrentComponent && <CurrentComponent />} 
       </PageLayout>
  )
}
