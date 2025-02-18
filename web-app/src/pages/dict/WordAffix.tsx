import React, { useEffect, useState } from 'react'
import AffixList, { AffixType } from './components/AffixList'
import { Tabs, Spin } from 'antd'
import { groupBy, sortGroupedData } from '@/utils/utilsArray'
import { batchUpdateWordAffix, deleteWordAffix, getWordAffix } from '@/service/dict'
import { useAuth } from '@/context/AuthContext'
import { LoadingOutlined } from '@ant-design/icons'
import { useNotification } from '@/hooks/useNotification'

const WordAffix = () => {
  const [activeKey, setActiveKey] = useState('prefix')
  const [affixData, setaffixData] = useState<AffixType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { isAuthenticated } = useAuth()
  const { handleRequestWithNotification } = useNotification()

  // 获取分组后的数据
  const groupedAffixData = sortGroupedData(groupBy(affixData, 'type'), 'key')

  const getTableData = () => {
    setIsLoading(true)
    getWordAffix()
      .then(res => {
        if (res?.length) {
          setaffixData(res as AffixType[])
        } else {
          setaffixData([])
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const updateAffixData = async (data: AffixType[]) => {
    const r = await handleRequestWithNotification(async () => await batchUpdateWordAffix(data), {
      successField: null,
      errorField: null,
    })

    if (r) {
      getTableData()
    }
  }

  const handleSync = () => updateAffixData(affixData)

  // 切换 tab 时的回调函数
  const handleTabChange = (key: string) => {
    setActiveKey(key)
  }

  // 添加词缀
  const handleAdd = (newAffix: AffixType) => updateAffixData([newAffix])

  // 删除词缀
  const handleDelete = async (id: string) => {
    console.log('Deleting affix with id:', id)
    if (!id) return

    // 删除逻辑
    const r = await handleRequestWithNotification(async () => await deleteWordAffix([id]), {
      successField: null,
      errorField: null,
    })

    if (r) {
      getTableData()
    }
  }

  // 编辑词缀
  const handleEdit = (id: string, updatedAffix: AffixType) => updateAffixData([{ ...updatedAffix, id }])

  useEffect(() => {
    if (!isAuthenticated) return
    getTableData()
  }, [isAuthenticated])

  const commonTabProps = {
    onEdit: handleEdit,
    onDelete: handleDelete,
    onAdd: handleAdd,
    onRefreshPage: getTableData,
    handleSync: handleSync,
  }

  const tabItems = [
    {
      key: 'prefix',
      label: '前缀',
      children: <AffixList data={groupedAffixData.prefix || []} {...commonTabProps} />,
    },
    {
      key: 'suffix',
      label: '后缀',
      children: <AffixList data={groupedAffixData.suffix || []} {...commonTabProps} />,
    },
  ]

  return (
    <div className=" mx-auto  bg-gray-200  " style={{ height: 'calc(100vh - 28px)' }}>
      {isLoading ? (
        <div className=" w-full   h-full flex justify-center items-center">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </div>
      ) : (
        <div className="p-2 box-border">
          <Tabs activeKey={activeKey} onChange={handleTabChange} items={tabItems}></Tabs>
        </div>
      )}
    </div>
  )
}

export default WordAffix
