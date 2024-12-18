import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Table, Button, Popconfirm, Space, Input, Switch } from 'antd'
import { ColumnType } from 'antd/es/table'
import { addWordRoot, batchUpdateWordRoot, deleteWordRoot, getWordRoots } from '@/service/dict'
import { useAuth } from '@/context/AuthContext'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { hasDuplicate } from '@/utils/utilsArray'
import ModalAddRoot from './components/ModalAddRoot'
import { useNotification } from '@/hooks/useNotification'

// 词根类型定义
export type WordRootType = {
  id?: string
  key: number
  root: string[]
  meaning: string
  wordCount: number
  inDocument: boolean
  inJson: boolean
  isLinked: boolean
}

// 自定义可编辑列
interface EditableColumnProps extends ColumnType<WordRootType> {
  editable?: boolean
  onCell?: (record: WordRootType) => any
}

type CollectonKeysType = Map<number, { key: number; newKey: number; id: string }>

// 编辑单元格组件
const EditableTableCell: React.FC<any> = ({
  title,
  editable,
  children,
  value,
  field,
  isBoolean,
  onChange,
  ...restProps
}) => {
  return (
    <div {...restProps}>
      {editable ? (
        isBoolean ? (
          <Switch value={value} onChange={val => onChange(val)} />
        ) : (
          <Input value={value} onChange={e => onChange(e.target.value)} placeholder={title} />
        )
      ) : (
        children
      )}
    </div>
  )
}

const WordRoot = () => {
  const initialData: WordRootType[] = []

  const [dataSource, setDataSource] = useState<WordRootType[]>(initialData)
  const [count, setCount] = useState<number>(dataSource.length)
  const [editingKey, setEditingKey] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const editedKeys = useRef<Set<number>>(new Set())
  const collectionRowkeys = useRef<CollectonKeysType>(new Map())

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1) // 当前页
  const [pageSize, setPageSize] = useState(10) // 每页条数
  const [pageTotal, setPageTotal] = useState(0) // 每页条数
  const [loading, setloading] = useState(true)

  const [addRootModalVisible, setAddRootModalVisible] = useState(false)

  const { isAuthenticated } = useAuth()

  const { handleRequestWithNotification, showNotification } = useNotification()

  const filteredData = dataSource.filter(
    item =>
      item.root.some(word => word.toLowerCase().includes(searchText.toLowerCase())) ||
      item.meaning.toLowerCase().includes(searchText.toLowerCase()),
  )
  // 分页配置
  const paginationConfig = {
    current: currentPage,
    pageSize: pageSize,
    total: pageTotal,
    onChange: handlePageChange,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '30', '50'],
    showTotal: (total: number) => `共 ${total} 条数据`,
  }

  const handleChangeWordsText = (val: string, rowKey: number) => {
    let arr = val.split('/')
    setDataSource(preData => {
      return preData.map(item => {
        if (item.key === editingKey) {
          return {
            ...item,
            root: arr,
          }
        }
        return item
      })
    })
  }

  const editableColumns: (EditableColumnProps & { isBoolean?: boolean })[] = [
    {
      title: 'Key',
      dataIndex: 'key',
      isBoolean: false,
      editable: false,
      fixed: true,
      width: 60,
      // render: (text, record) => text.toString(),
      render: (text, record) => (
        <SortableRow id={record.key} collectionRowkeys={collectionRowkeys}>
          {collectionRowkeys.current.has(record.key) ? (
            <div>
              {collectionRowkeys.current.get(record.key)?.key}
              <span>-</span>
              {collectionRowkeys.current.get(record.key)?.newKey}
            </div>
          ) : (
            text
          )}
        </SortableRow>
      ),
    },
    {
      title: '词根',
      dataIndex: 'root',
      isBoolean: false,
      editable: true,
      fixed: true,
      width: 150,
      render: (text, record) => {
        if (editingKey === record.key) {
          // edit mode
          return (
            <Input
              value={record.root.join('/')}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChangeWordsText(e.target.value, record.key)
              }
            />
          )
        } else {
          return record.root.join('/')
        }
      },
    },
    {
      title: '词义',
      dataIndex: 'meaning',
      isBoolean: false,
      editable: true,
    },
    {
      title: '总词数',
      dataIndex: 'wordCount',
      isBoolean: false,
      editable: true,
    },
    {
      title: '是否录入文档',
      dataIndex: 'inDocument',
      isBoolean: true,
      editable: true,
    },
    {
      title: '是否录入json',
      dataIndex: 'inJson',
      isBoolean: true,
      editable: true,
    },
    {
      title: '文档&json是否已关联',
      dataIndex: 'isLinked',
      isBoolean: true,
      editable: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 200,
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Space>
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.key)}>
              <a>删除</a>
            </Popconfirm>
            <Button
              size="small"
              type="text"
              onClick={() => {
                setEditingKey(record.key)
              }}
            >
              Edit
            </Button>
            <Popconfirm title="确定保存?" onConfirm={() => handleSave(record.key)}>
              <a>Save</a>
            </Popconfirm>
          </Space>
        ) : null,
    },
  ]

  const mergedColumns = editableColumns.map(col => {
    if (!col.editable || col.render) {
      return col
    }
    return {
      ...col,
      width: col.width || 100,
      render: (text: any, record: WordRootType) => (
        <EditableTableCell
          editable={editingKey === record.key}
          value={text}
          isBoolean={col.isBoolean}
          onChange={(value: any) =>
            handleChange({
              rowKey: record.key,
              field: col.dataIndex as keyof WordRootType,
              value,
            })
          }
        >
          <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {col.isBoolean ? (record[col.dataIndex as keyof WordRootType] ? '√' : '×') : text}
          </div>
        </EditableTableCell>
      ),
    }
  })

  // 分页后数据
  // const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const getTableData = useCallback(async () => {
    setloading(true)
    getWordRoots({
      pageNumber: currentPage,
      pageSize,
      lastVisibleDocData: dataSource[dataSource.length - 1],
    })
      .then(res => {
        if (res) {
          setDataSource([...(res.data as WordRootType[])])
          setPageTotal(res.total)
        } else {
          setDataSource([])
          setPageTotal(0)
        }
      })
      .finally(() => {
        setloading(false)
        editedKeys.current.clear()
      })
  }, [currentPage, pageSize])

  // 过滤函数
  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1) // 搜索时重置页码
  }

  const handleDelete = async (key: React.Key) => {
    const tar = dataSource.find(item => item.key === key)
    if (!tar) return

    const r = await handleRequestWithNotification(async () => await deleteWordRoot([tar.id!]), {
      successField: null,
      errorField: null,
    })

    if (r) {
      collectionRowkeys.current.clear()
      editedKeys.current.clear()
      setEditingKey(null)
      getTableData()
    }
  }
  const handleSave = async (key: React.Key) => {
    const tar = dataSource.find(item => item.key === key)
    if (!tar) return

    const r = await handleRequestWithNotification(async () => await batchUpdateWordRoot([tar]), {
      successField: null,
      errorField: null,
    })

    if (r) {
      collectionRowkeys.current.clear()
      editedKeys.current.clear()
      setEditingKey(null)
      getTableData()
    }
  }

  const handleAdd = () => {
    setAddRootModalVisible(true)
  }
  const handleSyncKeys = async () => {
    console.log('collectionRowkeys: ', collectionRowkeys.current.values())
    const submiteData = Array.from(collectionRowkeys.current.values()).map(item => ({
      id: item.id,
      key: item.newKey,
    }))
    if (hasDuplicate(submiteData, 'key')) {
      showNotification('error', 'Can not include duplicate keys', 'message')
      return
    }

    const r = await handleRequestWithNotification(
      async () => await batchUpdateWordRoot(submiteData),
      {
        successField: null,
        errorField: null,
      },
    )

    if (r) {
      collectionRowkeys.current.clear()
      getTableData()
    }
  }
  const handleSync = async () => {
    const submiteData = dataSource.filter(item => editedKeys.current.has(item.key))

    const r = await handleRequestWithNotification(
      async () => await batchUpdateWordRoot(submiteData),
      {
        successField: null,
        errorField: null,
      },
    )

    if (r) {
      setEditingKey(null)
      getTableData()
    }
  }

  const handleChange = <K extends keyof WordRootType>({
    value,
    rowKey,
    field,
  }: {
    value: WordRootType[K]
    rowKey: number
    field: K
  }) => {
    editedKeys.current.add(rowKey)
    setDataSource(data =>
      data.map(item => {
        if (rowKey === item.key) {
          item[field] = value
        }
        return item
      }),
    )
  }

  // 分页改变时触发
  function handlePageChange(page: number, pageSize: number) {
    setCurrentPage(page)
    setPageSize(pageSize)
  }
  const sensors = useSensors(useSensor(PointerSensor))

  const moveRow = (fromIndex: number, toIndex: number) => {
    const updatedData = [...dataSource] // 复制一份原始数据
    // 交换 fromIndex 和 toIndex 位置的元素
    const temp = updatedData[fromIndex]
    updatedData[fromIndex] = updatedData[toIndex]
    updatedData[toIndex] = temp
    setDataSource(updatedData) // 更新数据源
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      // 找到元素的索引
      const oldIndex = dataSource.findIndex(row => row.key === active.id)
      const newIndex = dataSource.findIndex(row => row.key === over?.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        moveRow(oldIndex, newIndex)
        collectionRowkeys.current.set(active.id as number, {
          newKey: over?.id as number,
          key: active.id as number,
          id: dataSource[oldIndex].id as string,
        })
        collectionRowkeys.current.set(over?.id as number, {
          newKey: active?.id as number,
          key: over?.id as number,
          id: dataSource[newIndex].id as string,
        })
      }
    }
  }

  const onAddRoot = async ({ root, meaning, wordCount }: Partial<WordRootType>) => {
    if (!root) return

    const tar = {
      key: pageTotal + 1,
      root: root,
      meaning: meaning,
      wordCount: wordCount,
      inDocument: false,
      inJson: false,
      isLinked: false,
    }

    const r = await handleRequestWithNotification(
      async () => await addWordRoot(tar as WordRootType),
      {
        successField: null,
        errorField: null,
      },
    )
    if (r) {
      getTableData()
    }
    setAddRootModalVisible(false)
  }

  useEffect(() => {
    if (!isAuthenticated) return
    getTableData()
  }, [getTableData, isAuthenticated])

  return (
    <div className="container mx-auto p-6 bg-white">
      <Space style={{ marginBottom: 16 }} className=" items-start">
        <Input.Search
          size="small"
          placeholder="搜索词根或词义"
          value={searchText}
          onChange={e => handleSearch(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Button onClick={handleAdd} type="primary" size="small">
          添加
        </Button>
        <Button
          onClick={handleSync}
          type="primary"
          size="small"
          disabled={editedKeys.current.size === 0}
        >
          Sync Data
        </Button>
        <Button onClick={handleSyncKeys} type="primary" size="small">
          Sync Keys
        </Button>
      </Space>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <SortableContext
          items={filteredData.map(item => item.key)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            loading={loading}
            bordered
            size="small"
            scroll={{ y: 600 }}
            dataSource={filteredData} // 使用分页后的数据
            columns={mergedColumns as ColumnType<WordRootType>[]}
            rowClassName="editable-row"
            pagination={paginationConfig} // 配置分页
          />
        </SortableContext>
      </DndContext>

      <ModalAddRoot visible={addRootModalVisible} onAdd={onAddRoot} />
    </div>
  )
}

// 为每一行创建可排序的组件
const SortableRow = ({
  id,
  collectionRowkeys,
  children,
}: {
  id: number
  children: React.ReactNode
  collectionRowkeys: React.RefObject<CollectonKeysType>
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  })

  const styles = {
    transform: `translateY(${transform?.y || 0}px)`,
    transition,
    background: collectionRowkeys.current?.has(id) ? 'red' : '',
    // cursor: 'not-allowed',
  }

  if (collectionRowkeys.current?.has(id)) {
    return (
      <div style={{ ...styles, backgroundColor: 'green', cursor: 'not-allowed' }}>{children}</div>
    )
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={styles}>
      {children}
    </div>
  )
}

export default WordRoot
