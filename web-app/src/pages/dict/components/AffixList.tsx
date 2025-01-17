import React, { Key, useEffect, useMemo, useState } from 'react'
import { Table, Button, Modal, Space, Popconfirm, TableProps, Input } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import AffixForm from './AffixForm'
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getDuplicateKeys, hasDuplicate } from '@/utils/utilsArray'
import { batchUpdateWordAffix } from '@/service/dict'
import { useNotification } from '@/hooks/useNotification'

export type AffixType = {
  id?: string // 唯一标识符，必选
  key: number // 排序用的数字，必选
  type: 'prefix' | 'suffix' // 词缀类型，必选
  affix: string[] // 词缀数组，必选
  meaning: string // 词缀的含义，必选
  affectedPartsOfSpeech?: string[] // 影响的词性，选填
  examples?: string[] // 示例单词，选填
  origin?: string // 词缀的起源，选填
  variants?: string[] // 词缀的变体形式，选填
  commonCombinations?: string[] // 常见组合，选填
  grammarRules?: string // 语法规则，选填
  additionalInfo?: string // 其他附加信息，选填

  initialIndex?: number
}

interface Props {
  data: AffixType[]
  onEdit: (id: string, updatedAffix: AffixType) => void
  onDelete: (id: string) => void
  onAdd: (newAffix: AffixType) => void
  onRefreshPage: () => void
}

type CollectonKeysType = Map<number, { key: number; newKey: number; id: string }>

type OnChange = NonNullable<TableProps<AffixType>['onChange']>
type Filters = Parameters<OnChange>[1]

const AffixList: React.FC<Props> = ({ data, onEdit, onDelete, onAdd, onRefreshPage }) => {
  const [dataSource, setDataSource] = useState<AffixType[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingAffix, setEditingAffix] = useState<AffixType | null>(null)
  const [collectionRowkeys, setcollectionRowkeys] = useState<CollectonKeysType>(new Map())
  const [filteredInfo, setFilteredInfo] = useState<Filters>({})

  const { handleRequestWithNotification, showNotification, showConfirmationDialog } = useNotification()

  const handleFilterChange: OnChange = (pagination, filters, sorter) => {
    console.log('Various parameters', pagination, filters, sorter)
    setFilteredInfo(filters)
  }

  useEffect(() => {
    setDataSource(data.map((item, index) => ({ ...item, initialIndex: index })))
    console.log('data::::', data)
  }, [data])

  useEffect(() => {
    const keys = [...collectionRowkeys.keys()]
    const updateCollectionRowKeys = new Map(collectionRowkeys)

    keys.forEach(k => {
      const newIndex = dataSource.findIndex(item => item.key === k)
      const oldIndex = dataSource[newIndex].initialIndex
      if (newIndex === oldIndex) {
        updateCollectionRowKeys.delete(k)
      }
    })
    setcollectionRowkeys(updateCollectionRowKeys)
  }, [dataSource])

  const duplicateKeys = useMemo(
    () => getDuplicateKeys([...collectionRowkeys.values()], ['newKey'], []),
    [collectionRowkeys],
  )

  const handleUpdateKeys = async () => {
    const values = [...collectionRowkeys.values()]
    if (hasDuplicate(values, 'key') || hasDuplicate(values, 'newKey')) {
      showNotification('error', 'Duplicate keys found, please check again', 'message')
      return
    }
    console.log('collectionRowkeys: ', values)

    const valueString = values.map(item => `${item.key} -> ${item.newKey}`)

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to update these item keys ? [${valueString}]`,
    })

    if (!confirmed) return

    const r = await handleRequestWithNotification(
      async () => await batchUpdateWordAffix(values.map(item => ({ id: item.id, key: item.newKey }))),
      {
        successField: null,
        errorField: null,
      },
    )

    if (r) {
      collectionRowkeys.clear()
      onRefreshPage()
    }
  }

  const handleAddClick = () => {
    setEditingAffix(null)
    setIsModalVisible(true)
  }

  const handleEditClick = (affix: AffixType) => {
    setEditingAffix(affix)
    setIsModalVisible(true)
  }

  const handleDeleteClick = (id: string) => {
    onDelete(id)
  }

  const handleSave = (updatedAffix: AffixType) => {
    if (editingAffix?.id) {
      onEdit(editingAffix.id, updatedAffix)
    } else {
      onAdd(updatedAffix)
    }
    setIsModalVisible(false)
  }

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 60,
      render: (text: any, record: AffixType) => (
        <SortableRow id={record.key} collectionRowkeys={collectionRowkeys}>
          {collectionRowkeys.has(record.key) ? (
            <div
              style={{
                background: duplicateKeys.some(item => item.id === record.id) ? 'red' : '',
              }}
            >
              {collectionRowkeys.get(record.key)?.key}
              <span className=" px-2">&rarr;</span>
              {collectionRowkeys.get(record.key)?.newKey}
            </div>
          ) : (
            text
          )}
        </SortableRow>
      ),
    },
    {
      title: '1-based index',
      width: 200,
      render: (_: any, record: AffixType, index: number) => {
        return index + 1
      },
    },
    {
      title: '词缀',
      dataIndex: 'affix',
      key: 'affix',
      width: 200,
      render: (_: any, record: AffixType) => {
        return record.affix.join('/')
      },
      filterDropdown: () => (
        <div className="p-3">
          <Input
            allowClear={true}
            placeholder="Search Affix"
            onChange={e => setFilteredInfo({ affix: e.target.value ? [e.target.value] : null })}
          />
        </div>
      ),
      onFilter: (value: boolean | Key, record: AffixType) => {
        console.log('filter value: ', value)
        if (!value) return true
        return record.affix.some(af => af.includes(value as unknown as string)) // 模糊匹配
      },
      filteredValue: filteredInfo.affix || null, // 确保是 string[] 或 null
    },
    {
      title: '词性',
      dataIndex: 'affectedPartsOfSpeech',
      key: 'affectedPartsOfSpeech',
      width: 200,
      render: (_: any, record: AffixType) => {
        return record?.affectedPartsOfSpeech?.join('/')
      },
      filters: [
        { text: 'Recorded', value: true },
        { text: 'Not Recorded', value: false },
      ],
      onFilter: (value: boolean | Key, record: AffixType) => {
        const str = (record?.affectedPartsOfSpeech || []).filter(item => Boolean(item.trim()))
        if (value === true) {
          return str.length > 0
        } else if (value === false) {
          return str.length === 0
        }
        return false
      },
      filteredValue: filteredInfo.affectedPartsOfSpeech || null, // 确保该字段在没有过滤时为 `null`
    },
    { title: '含义', dataIndex: 'meaning', key: 'meaning' },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: any, record: AffixType) => (
        <span>
          <Button icon={<EditOutlined />} onClick={() => handleEditClick(record)} style={{ marginRight: 8 }} />
          <Popconfirm title="确定删除?" onConfirm={() => handleDeleteClick(record.id ? record.id : '')}>
            <DeleteOutlined />
          </Popconfirm>
        </span>
      ),
    },
  ]

  const sensors = useSensors(useSensor(PointerSensor))

  const moveRow = (fromIndex: number, toIndex: number) => {
    const updatedData = [...dataSource]
    const temp = updatedData[fromIndex]
    updatedData[fromIndex] = updatedData[toIndex]
    updatedData[toIndex] = temp
    setDataSource(updatedData)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = dataSource.findIndex(row => row.key === active.id)
      const newIndex = dataSource.findIndex(row => row.key === over?.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        moveRow(oldIndex, newIndex)
        const updateCollectionRowKeys = new Map(collectionRowkeys)
        updateCollectionRowKeys.set(active.id as number, {
          newKey: over?.id as number,
          key: active.id as number,
          id: dataSource[oldIndex].id as string,
        })
        updateCollectionRowKeys.set(over?.id as number, {
          newKey: active?.id as number,
          key: over?.id as number,
          id: dataSource[newIndex].id as string,
        })
        setcollectionRowkeys(updateCollectionRowKeys)
      }
    }
  }

  return (
    <div>
      <Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} style={{ marginBottom: 16 }}>
          添加
        </Button>
        <Button onClick={handleUpdateKeys} disabled={collectionRowkeys.size === 0} style={{ marginBottom: 16 }}>
          Update keys
        </Button>
      </Space>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <SortableContext items={dataSource.map(item => item.key)} strategy={verticalListSortingStrategy}>
          <Table
            dataSource={dataSource}
            columns={columns}
            rowKey="key"
            size="small"
            pagination={{ pageSize: 50 }}
            scroll={{ y: 600 }}
            onChange={handleFilterChange}
          />
        </SortableContext>
      </DndContext>

      <Modal
        title={editingAffix ? '编辑词缀' : '添加词缀'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <AffixForm affix={editingAffix} onSave={handleSave} />
      </Modal>
    </div>
  )
}

const SortableRow = ({
  id,
  collectionRowkeys,
  children,
}: {
  id: number
  collectionRowkeys: CollectonKeysType
  children: React.ReactNode
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  })

  // 计算元素的样式，动态调整边距或背景色
  const styles = {
    transform: `translateY(${transform?.y || 0}px)`,
    // transition,
    transition: transition ? 'transform 0.3s ease' : undefined,
    border: collectionRowkeys.has(id) ? '2px dotted red' : '',
    padding: '2px 8px',
    backgroundColor: collectionRowkeys.has(id) ? 'lightblue' : '',
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={styles}>
      {children}
    </div>
  )
}
export default AffixList
