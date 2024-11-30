import React, { useEffect, useState } from 'react'
import AffixList, { AffixType } from './components/AffixList'
import { Tabs, Button, Space } from 'antd'
import { groupBy, sortGroupedData } from '@/utils/utilsArray'
import { batchUpdateWordAffix, getWordAffix } from '@/service/dict'
import { handleRequestWithNotification } from '@/utils/utilsRequest'
import { useAuth } from '@/context/AuthContext'

const WordAffix = () => {
  const [activeKey, setActiveKey] = useState('prefix')
  const [affixData, setaffixData] = useState<AffixType[]>([])

  const { isAuthenticated } = useAuth()

  // 获取分组后的数据
  const groupedAffixData = sortGroupedData(groupBy(affixData, 'type'), 'key')

  const getTableData = () => {
    getWordAffix().then(res => {
      if (res?.length) {
        setaffixData(res as AffixType[])
      } else {
        setaffixData([])
      }
    })
  }

  const handleSync = async () => {
    const r = await handleRequestWithNotification(
      async () => await batchUpdateWordAffix(affixData),
      {
        successField: null,
        errorField: null,
      },
    )

    if (r) {
      getTableData()
    }
  }

  // 切换 tab 时的回调函数
  const handleTabChange = (key: string) => {
    setActiveKey(key)
  }

  // 添加词缀
  const handleAdd = (newAffix: AffixType) => {
    // 这里添加新的词缀到 affixData 数据中
    // 更新数据并刷新表格
    console.log('Adding new affix:', newAffix)
  }

  // 删除词缀
  const handleDelete = (id: string) => {
    // 删除逻辑
    console.log('Deleting affix with id:', id)
  }

  // 编辑词缀
  const handleEdit = (id: string, updatedAffix: AffixType) => {
    // 编辑逻辑
    console.log('Editing affix with id:', id, 'Updated:', updatedAffix)
  }

  useEffect(() => {
    if (!isAuthenticated) return
    getTableData()
  }, [isAuthenticated])

  const tabItems = [
    {
      key: 'prefix',
      label: '前缀',
      children: (
        <AffixList
          data={groupedAffixData.prefix || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      ),
    },
    {
      key: 'suffix',
      label: '后缀',
      children: (
        <AffixList
          data={groupedAffixData.suffix || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      ),
    },
  ]

  return (
    <div className=" container mx-auto bg-red-300 ">
      <div className="p-2">
        <div>
          <Space>
            <Button type="primary" onClick={handleSync} disabled>
              Sync Data
            </Button>
          </Space>
        </div>
        <Tabs activeKey={activeKey} onChange={handleTabChange} items={tabItems}></Tabs>
      </div>
    </div>
  )
}

export default WordAffix
