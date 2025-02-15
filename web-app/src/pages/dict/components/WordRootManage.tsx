import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table, Button, Popconfirm, Space, Input, Switch, Tooltip, Tag } from 'antd'
import { ColumnType, TablePaginationConfig } from 'antd/es/table'
import { batchUpdateWordRoot, deleteWordRoot, getWordRootRow, getWordRoots } from '@/service/dict'
import { useAuth } from '@/context/AuthContext'
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { hasCommonElements, hasDuplicate } from '@/utils/utilsArray'
import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, FileImageOutlined } from '@ant-design/icons'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/solid'

import { getAllScreenshotDoc, ScreenshotDocType } from '@/service/screenshotDoc'
import ModalForm from '@/components/modal/ModalForm'
import FormAddRoot from './FormAddRoot'
import ScreenDocScanner from './ScreenDocScanner'
import { shuffleColors } from '@/utils/utilsColor'
import { FilterValue, SorterResult } from 'antd/es/table/interface'

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
type TableRow = WordRootType & { isScreenDocUploaded?: boolean; screenDoc?: ScreenshotDocType[] }
// 自定义可编辑列
interface EditableColumnProps extends ColumnType<TableRow> {
  editable?: boolean
  onCell?: (record: TableRow) => any
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

const WordRootManage = () => {
  const [dataSource, setDataSource] = useState<TableRow[]>([])
  const [filteredData, setFilteredData] = useState<TableRow[]>([])
  const [count, setCount] = useState<number>(dataSource.length)
  const [editingKey, setEditingKey] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const editedKeys = useRef<Set<number>>(new Set())
  const collectionRowkeys = useRef<CollectonKeysType>(new Map())

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1) // 当前页
  const [pageSize, setPageSize] = useState(50) // 每页条数
  const [pageTotal, setPageTotal] = useState(0) // 每页条数
  const [loading, setloading] = useState(true)

  const [addRootModalVisible, setAddRootModalVisible] = useState(false)
  const [screenModalVisible, setScreenModalVisible] = useState(false)
  const [currentScreenDoc, setCurrentScreenDoc] = useState<ScreenshotDocType | null>(null)

  const { isAuthenticated } = useAuth()

  const { handleRequestWithNotification, showNotification, showConfirmationDialog } = useNotification()
  const shuffledColors = shuffleColors()

  // const filteredData = dataSource.filter(
  //   item =>
  //     item.root.some(word => word.toLowerCase().includes(searchText.toLowerCase())) ||
  //     item.meaning.toLowerCase().includes(searchText.toLowerCase()),
  // )
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

  const rootTotalNumber = useMemo(() => {
    const total = filteredData.reduce((sum, record) => sum + (Number(record.wordCount) || 0), 0)
    return total
  }, [filteredData])

  const handleChangeWordsText = (val: string, rowKey: number) => {
    let arr = val
      .split('/')
      .map(item => item.trim())
      .filter(Boolean)
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

  const handleScanDoc = (doc: ScreenshotDocType) => {
    console.log('row record: ', doc)
    if (!doc) return
    setCurrentScreenDoc(doc)
    setScreenModalVisible(true)
  }

  const editableColumns: (EditableColumnProps & { isBoolean?: boolean })[] = [
    {
      title: 'Key',
      dataIndex: 'key',
      isBoolean: false,
      editable: false,
      fixed: true,
      width: 40,
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChangeWordsText(e.target.value, record.key)}
            />
          )
        } else {
          return <span style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>[{record.root.join(', ')}]</span>
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
      title: `总词数(${rootTotalNumber})`,
      dataIndex: 'wordCount',
      isBoolean: false,
      editable: true,
      width: 50,
    },
    {
      title: '是否录入文档',
      dataIndex: 'inDocument',
      isBoolean: true,
      editable: true,
      width: 50,
      filters: [
        { text: 'Recorded', value: true },
        { text: 'Not Recorded', value: false },
      ],
      onFilter: (value, record) => (record.inDocument || false) === value,
    },
    {
      title: '是否录入json',
      dataIndex: 'inJson',
      isBoolean: true,
      editable: true,
      width: 50,
      filters: [
        { text: 'Recorded', value: true },
        { text: 'Not Recorded', value: false },
      ],
      onFilter: (value, record) => (record.inJson || false) === value,
    },
    {
      title: '文档&json是否已关联',
      dataIndex: 'isLinked',
      isBoolean: true,
      editable: true,
      width: 50,
      filters: [
        { text: 'Linked', value: true },
        { text: 'Not Linked', value: false },
      ],
      onFilter: (value, record) => (record.isLinked || false) === value,
    },
    {
      title: '文档',
      dataIndex: 'docName',
      isBoolean: false,
      editable: false,
      width: 50,
      // filtered: true,
      filters: [
        { text: 'Uploaded', value: true },
        { text: 'Not Uploaded', value: false },
      ],
      onFilter: (value, record) => (record.isScreenDocUploaded || false) === value,
      render: (text, record) => {
        return (
          <div className=" inline-block">
            {record.isScreenDocUploaded && record.screenDoc?.length && (
              <div className=" flex flex-wrap">
                {record.screenDoc.map(doc => (
                  <Button
                    key={doc.id}
                    icon={
                      <Tooltip
                        title={
                          <div className=" inline-block">
                            <h2>{doc.docName}</h2>
                            <div className="flex flex-wrap gap-2">
                              {doc.keyTerms?.map((tg, index) => (
                                <Tag key={tg} bordered={false} color={shuffledColors[index % shuffledColors.length]}>
                                  {tg}
                                </Tag>
                              ))}
                            </div>
                          </div>
                        }
                      >
                        <FileImageOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    }
                    type="text"
                    onClick={() => handleScanDoc(doc)}
                  ></Button>
                ))}
              </div>
            )}
            {!record.isScreenDocUploaded && <Button icon={<FileImageOutlined />} disabled={true} type="text" />}
          </div>
        )
      },
    },
    {
      title: 'json文档',
      dataIndex: 'jsonDoc',
      isBoolean: false,
      editable: false,
      width: 50,
      render: () => '-',
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 100,
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Space>
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.key)}>
              <DeleteOutlined className="size-5 text-red-400" />
            </Popconfirm>
            <Button
              size="small"
              type="text"
              disabled={editingKey !== null && editingKey !== record.key}
              onClick={() => {
                setEditingKey(editingKey === record.key ? null : record.key)
              }}
            >
              {editingKey === record.key ? (
                <ArrowUturnLeftIcon className=" size-5 text-blue-500" />
              ) : (
                <EditOutlined className="size-5" />
              )}
            </Button>

            {editingKey === record.key && (
              <Popconfirm title="确定保存?" onConfirm={() => handleSave(record.key)}>
                <CheckOutlined className="size-5 text-green-500" />
              </Popconfirm>
            )}
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
            {col.isBoolean ? (
              record[col.dataIndex as keyof WordRootType] ? (
                <Button icon={<CheckOutlined />} type="text" />
              ) : (
                <Button icon={<CloseOutlined />} type="text" danger />
              )
            ) : (
              text
            )}
          </div>
        </EditableTableCell>
      ),
    }
  })

  // 分页后数据
  // const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const getTableData = useCallback(async () => {
    setloading(true)

    Promise.all([
      getWordRoots({
        pageNumber: currentPage,
        pageSize,
        lastVisibleDocData: dataSource[dataSource.length - 1],
      }),
      getAllScreenshotDoc(),
    ])
      .then(([roots, screen]) => {
        if (roots.data) {
          const data: TableRow[] = roots.data.map(item => {
            const combined = { ...item } as TableRow
            const tarDocs = screen.filter(doc => hasCommonElements(item.root, doc.keyTerms || [], 2))
            if (tarDocs.length) {
              combined.isScreenDocUploaded = true
              combined.screenDoc = tarDocs.sort((a, b) => (a.order || 0) - (b.order || 0))
            }
            return combined
          })
          setDataSource([...data])
          setFilteredData([...data])
          setPageTotal(roots.total)
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

  // 过滤逻辑
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<TableRow> | SorterResult<TableRow>[],
  ) => {
    console.log('filters : ', filters)
    setFilteredData(() => {
      let updatedData = [...dataSource]

      updatedData = updatedData.filter(item => {
        return mergedColumns
          .filter(column => column.onFilter)
          .filter(column => filters[column.dataIndex as string])
          .every(column => {
            let filterValue = filters[column.dataIndex as string]

            if (filterValue === null) return true
            filterValue = (filterValue?.[0] || null) as unknown as FilterValue
            if (filterValue === null) return true
            if (
              typeof filterValue === 'boolean' ||
              typeof filterValue === 'string' ||
              typeof filterValue === 'number'
            ) {
              return column.onFilter?.(filterValue, item)
            }
          })
      })
      console.log('updatedData lenght: ', updatedData.length)
      return updatedData
    })
  }

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
    const confirmed = await showConfirmationDialog({ content: 'Are you sure you want to sync this data?' })
    if (!confirmed) return

    console.log('collectionRowkeys: ', collectionRowkeys.current.values())
    const submiteData = Array.from(collectionRowkeys.current.values()).map(item => ({
      id: item.id,
      key: item.newKey,
    }))
    if (hasDuplicate(submiteData, 'key')) {
      showNotification('error', 'Can not include duplicate keys', 'message')
      return
    }

    const r = await handleRequestWithNotification(async () => await batchUpdateWordRoot(submiteData), {
      successField: null,
      errorField: null,
    })

    if (r) {
      collectionRowkeys.current.clear()
      getTableData()
    }
  }
  const handleSync = async () => {
    const confirmed = await showConfirmationDialog({ content: 'Are you sure you want to sync this data?' })
    if (!confirmed) return

    const submiteData = dataSource.filter(item => editedKeys.current.has(item.key))

    const r = await handleRequestWithNotification(async () => await batchUpdateWordRoot(submiteData), {
      successField: null,
      errorField: null,
    })

    if (r) {
      setEditingKey(null)
      getTableData()
    }
  }

  const handleCopyURL = () => {
    copyText(window.location.href).then(() => {
      showNotification('success', 'Copied successfully', 'message')
    })
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

  const onAddRoot = async (queue: Partial<WordRootType>[]) => {
    // { root, meaning, wordCount }
    if (!queue.length) return

    const allRoots = queue.reduce((pre, cur) => {
      const curRoots = cur.root || []
      return pre.concat(curRoots)
    }, [] as string[])

    const exist = await getWordRootRow(allRoots)
    if (exist.length) {
      const existRoots = exist.map(item => item.root.join(','))
      showNotification('error', `[${existRoots.toLocaleString()} is existed.]`, 'message')
      setAddRootModalVisible(false)
      return
    }

    const submitTars = queue.map((q, index) => {
      const tar = {
        key: pageTotal + 1 + index,
        root: q.root,
        meaning: q.meaning,
        wordCount: q.wordCount,
        inDocument: false,
        inJson: false,
        isLinked: false,
      }
      return tar
    }) as Partial<WordRootType>[]

    // const tar = {
    //   key: pageTotal + 1,
    //   root: root,
    //   meaning: meaning,
    //   wordCount: wordCount,
    //   inDocument: false,
    //   inJson: false,
    //   isLinked: false,
    // }

    // batchUpdateWordRoot

    const r = await handleRequestWithNotification(async () => await batchUpdateWordRoot(submitTars), {
      successField: null,
      errorField: null,
    })

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
    <>
      <div className=" mx-auto p-6 bg-white box-border">
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
          <Button onClick={handleSync} type="primary" size="small" disabled={editedKeys.current.size === 0}>
            Sync Data
          </Button>
          <Button onClick={handleSyncKeys} type="primary" size="small">
            Sync Keys
          </Button>
          <Button onClick={handleCopyURL} type="primary" size="small">
            Copy Page URL
          </Button>
        </Space>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          <SortableContext items={dataSource.map(item => item.key)} strategy={verticalListSortingStrategy}>
            <Table
              loading={loading}
              bordered
              size="small"
              scroll={{ y: 600 }}
              dataSource={dataSource} // 使用分页后的数据
              columns={mergedColumns as ColumnType<TableRow>[]}
              rowClassName="editable-row"
              pagination={paginationConfig} // 配置分页
              onChange={handleTableChange}
            />
          </SortableContext>
        </DndContext>
      </div>
      <ModalForm<WordRootType, 'batch'>
        width={800}
        visible={addRootModalVisible}
        onBatchSubmit={onAddRoot}
        onClose={() => setAddRootModalVisible(false)}
        Child={FormAddRoot}
      />
      <ModalForm
        visible={screenModalVisible}
        data={currentScreenDoc}
        onSubmit={val => console.log('submit ', val)}
        onClose={() => setScreenModalVisible(false)}
        Child={ScreenDocScanner}
      />
    </>
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
    return <div style={{ ...styles, backgroundColor: 'green', cursor: 'not-allowed' }}>{children}</div>
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={styles}>
      {children}
    </div>
  )
}

export default WordRootManage
