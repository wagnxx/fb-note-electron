import React, { useCallback, useEffect, useState } from 'react'
import { Table, Button, Popconfirm, Space, Input } from 'antd'
import { ColumnType } from 'antd/es/table'
import { batchUpdateWordRoot, getWordRoots } from '@/service/dict'
import { handleRequestWithNotification } from '@/utils/utilsRequest'
import { useAuth } from '@/context/AuthContext'

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

// 编辑单元格组件
const EditableTableCell: React.FC<any> = ({
  title,
  editable,
  children,
  value,
  field,
  onChange,
  ...restProps
}) => {
  return (
    <div {...restProps}>
      {editable ? (
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={title} />
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

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1) // 当前页
  const [pageSize, setPageSize] = useState(5) // 每页条数
  const [pageTotal, setPageTotal] = useState(0) // 每页条数
  const [loading, setloading] = useState(true)

  const { isAuthenticated } = useAuth()

  const filteredData = dataSource.filter(
    item =>
      item.root.some(word => word.toLowerCase().includes(searchText.toLowerCase())) ||
      item.meaning.toLowerCase().includes(searchText.toLowerCase()),
  )

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
      })
  }, [currentPage, pageSize])

  // 过滤函数
  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1) // 搜索时重置页码
  }

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter(item => item.key !== key)
    setDataSource(newData)
  }

  const handleAdd = () => {
    const newData = {
      key: pageTotal + 1,
      root: [],
      meaning: '',
      wordCount: 0,
      inDocument: false,
      inJson: false,
      isLinked: false,
    }
    setDataSource([...dataSource, newData])
  }

  const handleSync = async () => {
    const r = await handleRequestWithNotification(
      async () =>
        await batchUpdateWordRoot(
          dataSource.map(item => ({
            id: item?.id,
            key: Number(item.key),
          })),
        ),
      {
        successField: null,
        errorField: null,
      },
    )

    if (r) {
      console.log('operation successful')
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
    setDataSource(data =>
      data.map(item => {
        if (rowKey === item.key) {
          item[field] = value
        }
        return item
      }),
    )
  }

  const editableColumns: (EditableColumnProps & { isBoolean?: boolean })[] = [
    {
      title: 'Key',
      dataIndex: 'key',
      isBoolean: false,
      editable: false,
      fixed: true,
      width: 60,
      render: (text, record) => text.toString(),
    },
    {
      title: '词根',
      dataIndex: 'root',
      isBoolean: false,
      editable: true,
      fixed: true,
      width: 150,
      render: (text, record) => text.toString(),
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
          onChange={(value: any) =>
            handleChange({
              rowKey: record.key,
              field: col.dataIndex as keyof WordRootType,
              value,
            })
          }
        >
          {col.isBoolean ? (record[col.dataIndex as keyof WordRootType] ? '√' : '×') : text}
        </EditableTableCell>
      ),
    }
  })

  // 分页改变时触发
  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

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

  useEffect(() => {
    if (!isAuthenticated) return
    getTableData()
  }, [getTableData, isAuthenticated])

  return (
    <div className="container mx-auto">
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索词根或词义"
          value={searchText}
          onChange={e => handleSearch(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Button onClick={handleAdd} type="primary" icon={<i className="anticon anticon-plus" />}>
          添加
        </Button>
        <Button
          onClick={handleSync}
          type="primary"
          icon={<i className="anticon anticon-plus" />}
          disabled
        >
          Sync Data
        </Button>
      </Space>
      <Table
        loading={loading}
        bordered
        scroll={{ y: 600 }}
        dataSource={filteredData} // 使用分页后的数据
        columns={mergedColumns as ColumnType<WordRootType>[]}
        rowClassName="editable-row"
        pagination={paginationConfig} // 配置分页
      />
    </div>
  )
}

export default WordRoot
