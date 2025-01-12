import DesktopOnly from '@/components/platform/DesktopOnly'
import { TableOutlined } from '@ant-design/icons'
import { Menu } from 'antd'
import React, { FC, useEffect, useState } from 'react'

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

const DOC_DIR =
  '/Users/wagnxx/dt/playing/electron/fb-note-electron/electron/support/assets/raw/dict/docs/'

interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileSystemItem[]
}

interface MenuItem {
  key: string
  icon?: React.ReactNode
  label: string
  children?: MenuItem[]
}

interface Props {
  onItemClick: ({ key }: { key: string }) => void
}

const convertToMenuItems = (items: FileSystemItem[]): MenuItem[] => {
  return items.map(item => {
    const menuItem: MenuItem = {
      key: item.path, // 使用文件路径作为 key，避免重复
      label: item.name,
      children: item.isDirectory && item.children ? convertToMenuItems(item.children) : undefined,
    }
    return menuItem
  })
}

const WordRootDocMenu: FC<Props> = ({ onItemClick }) => {
  const [menus, setMenus] = useState<MenuItem[]>([])

  useEffect(() => {
    ipcRenderer
      .invoke(IPC_ACTIONS.GET_DIRECTORY_STRUCTURE, encodeURIComponent(DOC_DIR))
      .then((res: FileSystemItem[]) => {
        console.log('Directory structure:', res)
        const menuItems = convertToMenuItems(res)
        setMenus(menuItems)
      })
      .catch((error: Error) => {
        console.error('Error fetching directory structure:', error)
      })
  }, [])

  return (
    <Menu
      mode="inline"
      defaultSelectedKeys={['table']}
      onClick={onItemClick}
      items={[
        { key: 'table', icon: <TableOutlined />, label: '词根管理' },
        // { key: 'pdf', icon: <FilePdfOutlined />, label: '文档预览' },
        ...menus, // 添加从目录结构转换的菜单项
      ]}
    />
  )
}

// export default WordRootDocMenu

export default (props: Props) => (
  <DesktopOnly children={<WordRootDocMenu {...props} />}></DesktopOnly>
)
