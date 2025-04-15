import React, { useEffect, useRef, useState } from 'react'
import { Table, Button, Popconfirm } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { PermissionItem } from '../types/types'
import PermissionModal from './PermissionModal'
import { AppDispatch } from '@/store/store'
import {
  addPermission,
  batchUpdatePermission,
  deletePermission,
  fetchPermissions,
  updatePermission,
} from '../slices/rolePermissionSlice'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'

const PermissionManagement = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions, loading } = useSelector((state: RootState) => state.rolePermission)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PermissionItem | null>(null)
  const selectedKeysRef = useRef<PermissionItem[]>([])

  useEffect(() => {
    dispatch(fetchPermissions())
  }, [dispatch])

  const handleSubmit = (data: PermissionItem) => {
    let action = editing ? updatePermission : addPermission

    dispatch(action(data) as any)
      .unwrap()
      .then((res: string | boolean) => {
        if (res) {
          dispatch(fetchPermissions())
        }
        setModalOpen(false)
      })
  }

  const handleDelete = (item: PermissionItem) => {
    if (!item.id) return
    dispatch(deletePermission([item.id]))
      .unwrap()
      .then(res => {
        if (res) {
          dispatch(fetchPermissions())
        }
      })
  }

  const handleTranslateIndex = () => {
    if (!selectedKeysRef.current.length) return
    const rows = selectedKeysRef.current
      .filter(item => Boolean(item.id))
      .filter(item => typeof item.index === 'string')
      .map(item => ({ id: item.id!, data: { index: Number(item.index) } }))
    dispatch(batchUpdatePermission(rows))
  }

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      selectedKeysRef.current = selectedRows
    },
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center gap-3  mb-4">
        <h2 className="text-lg font-medium">Permission Management</h2>
        <Button danger style={{ marginLeft: 'auto' }} disabled onClick={handleTranslateIndex}>
          Translate index To Numbers
        </Button>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          type="primary"
        >
          Add Permission
        </Button>
      </div>
      <Table
        dataSource={permissions}
        // rowSelection={rowSelection}
        rowKey="id"
        loading={loading}
        columns={[
          { title: 'Key', dataIndex: 'key' },
          { title: 'Index', dataIndex: 'index' },
          // { title: 'Value', dataIndex: 'value' },
          { title: 'Desc (EN)', dataIndex: 'desc_en' },
          { title: '描述 (ZH)', dataIndex: 'desc_zh' },
          {
            title: 'Actions',
            render: (_: any, record: PermissionItem) => (
              <div className="flex gap-2">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  title="Edit"
                  onClick={() => {
                    setEditing(record)
                    setModalOpen(true)
                  }}
                />
                <Popconfirm title="Delete this permission?" onConfirm={() => handleDelete(record)}>
                  <Button type="text" icon={<DeleteOutlined />} title="Delete" danger />
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />
      <PermissionModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        defaultData={editing}
      />
    </div>
  )
}

export default PermissionManagement
