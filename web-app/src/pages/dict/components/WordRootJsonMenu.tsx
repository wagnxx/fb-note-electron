import DesktopOnly from '@/components/platform/DesktopOnly'
import { FileSystemItem, getDirectoryStructure } from '@/utils/utilsIpc'
import { TableOutlined } from '@ant-design/icons'
import { Menu } from 'antd'
import React, { FC, useEffect, useState } from 'react'

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

// eslint-disable-next-line no-undef
const { REACT_APP_SOURCE_PATH } = process.env

const DOC_DIR = REACT_APP_SOURCE_PATH + '/dict/json/'

interface MenuItem {
  key: string
  icon?: React.ReactNode
  label: string
  children?: MenuItem[]
}

type Props = {
  onItemClick: ({ key }: { key: string }) => void
}

const commonItems: MenuItem[] = [{ key: 'table', icon: <TableOutlined />, label: '词根管理' }]

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

const MenuComp: FC<{ menus: MenuItem[] } & Pick<Props, 'onItemClick'>> = ({ menus, onItemClick }) => {
  return <Menu mode="inline" defaultSelectedKeys={['table']} onClick={onItemClick} items={menus} />
}

const WordRootDocMenu: FC<Props> = ({ onItemClick }) => {
  const [menus, setMenus] = useState<MenuItem[]>([])

  useEffect(() => {
    getDirectoryStructure(encodeURIComponent(DOC_DIR))
      .then(res => {
        console.log('Directory structure:', res)
        const sortedData = res.sort((a, b) => {
          let an = (a.name || '').match(/^(\d+)\./)?.[1] || 0
          let bn = (b.name || '').match(/^(\d+)\./)?.[1] || 0
          return Number(an) - Number(bn)
        })
        const menuItems = convertToMenuItems(res)
        setMenus(menuItems)
      })
      .catch((error: Error) => {
        console.error('Error fetching directory structure:', error)
      })
  }, [])

  return (
    <MenuComp
      menus={[
        ...commonItems,
        ...menus, // 添加从目录结构转换的菜单项
      ]}
      onItemClick={onItemClick}
    />
  )
}

// export default WordRootDocMenu

export default (props: Props) => (
  <DesktopOnly
    children={<WordRootDocMenu {...props} />}
    fallback={<MenuComp menus={[...commonItems]} onItemClick={props.onItemClick} />}
  ></DesktopOnly>
)
