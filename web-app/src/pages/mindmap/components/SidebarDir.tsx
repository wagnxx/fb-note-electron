import { DownOutlined } from '@ant-design/icons'
import { Button, Dropdown, Form, FormInstance, Input, MenuProps, Tabs, TabsProps } from 'antd'
import React, { FC, useRef, useState } from 'react'
import TabpanelLocal from './TabpanelLocal'
import TabpanelCloud from './TabpanelCloud'
import { useNotification } from '@/hooks/useNotification'
import { Save } from 'lucide-react'
import { TabItem } from '@/features/mindmap/types'
import useUserRole from '@/features/rolePermission/hooks/useUserRole'
import { PERMISSIONS } from '@/features/rolePermission'
import DesktopOnly from '@/components/platform/DesktopOnly'

type StorageType = 'local' | 'cloud'

// 使用 StorageType 来限制 key 和 value 类型
const TABS_KEY: Record<StorageType, StorageType> = {
  local: 'local',
  cloud: 'cloud',
}

// 通过 typeof 获取 Tabs_key 的类型
type TabsKeyType = typeof TABS_KEY

export type TabpanelRef = {
  saveNewFile: (filename: string, data: TabItem[]) => Promise<boolean>
  saveFile: () => Promise<boolean>
}

const SidebarDir: FC<{
  getCanvasData: () => TabItem[] | undefined
  resetCanvasData: (data: TabItem[]) => void
}> = ({ getCanvasData, resetCanvasData }) => {
  const [isSaving, setIsSaving] = useState(false)
  const [activeTabsKey, setActiveTabsKey] = useState<StorageType>()
  const localRef = useRef<TabpanelRef>(null)
  const cloudRef = useRef<TabpanelRef>(null)

  const { showConfirmModal } = useNotification()
  const { isPermitted } = useUserRole()

  const onChange = (key: StorageType) => {
    setActiveTabsKey(key)
    resetCanvasData([])
  }

  // TODO child ref implement
  const handleSaveAsNew = async (typ: StorageType) => {
    const data = getCanvasData()
    if (!data) return
    const docTypeFormRef = React.createRef<FormInstance<any>>()

    const values = await showConfirmModal<{ filename: string }>({
      title: 'Input File Name',
      content: (
        <Form ref={docTypeFormRef}>
          <Form.Item name="filename" rules={[{ required: true, message: 'Please input filername!' }]}>
            <Input />
          </Form.Item>
        </Form>
      ),
    })
    if (!values) return

    setIsSaving(true)

    if (typ === TABS_KEY.local) {
      localRef.current?.saveNewFile(values.filename, data).finally(() => {
        setIsSaving(false)
      })
    }
    if (typ === TABS_KEY.cloud) {
      cloudRef.current?.saveNewFile(values.filename, data).finally(() => {
        setIsSaving(false)
      })
    }
  }

  const handleSaveCurrentFile = async () => {
    if (activeTabsKey === TABS_KEY.local) {
      localRef.current?.saveFile()
    }
    if (activeTabsKey === TABS_KEY.cloud) {
      cloudRef.current?.saveFile()
    }
  }

  const tabsItems: TabsProps['items'] = [
    {
      key: TABS_KEY.local,
      label: 'Local',
      children: (
        <DesktopOnly>
          <TabpanelLocal
            key={activeTabsKey}
            ref={localRef}
            getCanvasData={getCanvasData}
            resetCanvasData={resetCanvasData}
          />
        </DesktopOnly>
      ),
    },
    {
      key: TABS_KEY.cloud,
      label: 'Cloud-based',
      disabled: !isPermitted(PERMISSIONS.MIND_READ),
      children: (
        <TabpanelCloud
          key={activeTabsKey}
          ref={cloudRef}
          getCanvasData={getCanvasData}
          resetCanvasData={resetCanvasData}
        />
      ),
    },
  ]

  const memuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Button
          type="text"
          style={{ display: 'unset', textAlign: 'left' }}
          block
          onClick={() => handleSaveAsNew('local')}
          disabled={activeTabsKey !== TABS_KEY.local}
        >
          Save Locally As New
        </Button>
      ),
    },
    {
      key: '2',
      disabled: true,
      label: (
        <Button
          type="text"
          style={{ display: 'unset', textAlign: 'left' }}
          block
          onClick={() => handleSaveAsNew('cloud')}
          disabled={!isPermitted(PERMISSIONS.MIND_EDIT) && activeTabsKey === TABS_KEY.cloud}
        >
          Save to Cloud As New
        </Button>
      ),
    },
    {
      key: '3',
      label: (
        <Button
          type="text"
          style={{ display: 'unset', textAlign: 'left' }}
          block
          onClick={handleSaveCurrentFile}
          disabled={!isPermitted(PERMISSIONS.MIND_EDIT) && activeTabsKey === TABS_KEY.cloud}
        >
          Save File
        </Button>
      ),
    },
  ]

  return (
    <div className="p-2">
      <div className="flex flex-row justify-between items-center">
        <Dropdown menu={{ items: memuItems }} trigger={['click']}>
          <Button type="text" color="primary" loading={isSaving} icon={<DownOutlined />} iconPosition="end">
            save <Save size={18} />
          </Button>
        </Dropdown>
      </div>
      <Tabs accessKey={activeTabsKey} items={tabsItems} onChange={val => onChange(val as StorageType)} />
    </div>
  )
}

export default SidebarDir
