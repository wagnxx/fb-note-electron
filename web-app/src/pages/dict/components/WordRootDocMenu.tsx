import DesktopOnly from '@/components/platform/DesktopOnly'
import { getDirectoryStructure } from '@/utils/utilsIpc'
import { TableOutlined } from '@ant-design/icons'
import { FileSystemItem } from '@shared/types'
import { Menu, MenuProps } from 'antd'
import React, { FC, useEffect, useState } from 'react'

// eslint-disable-next-line no-undef
const { REACT_APP_SOURCE_PATH } = process.env

const DOC_DIR = REACT_APP_SOURCE_PATH + '/dict/docs/'

type MenuItem = Required<MenuProps>['items'][number]

type Props = {
  onItemClick: ({ key }: { key: string }) => void
}

const commonItems: MenuItem[] = [
  {
    key: 'table',
    icon: <TableOutlined />,
    label: '词根管理',
    children: [
      {
        key: 'table-g-1',
        label: 'Part 1',
        type: 'group',
        children: [
          { key: 'table-1', label: '1-50' },
          { key: 'table-2', label: '50-100' },
        ],
      },
      {
        key: 'table-g-2',
        label: 'Part 2',
        type: 'group',
        children: [
          { key: 'table-3', label: '100-150' },
          { key: 'table-4', label: '150-200' },
        ],
      },
      {
        key: 'table-g-3',
        label: 'Part 3',
        type: 'group',
        children: [
          { key: 'table-5', label: '200-250' },
          { key: 'table-6', label: '250-300' },
        ],
      },
    ],
  },
]

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
