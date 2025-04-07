import React, { useEffect, useState } from 'react'
import { Table, Button, Popconfirm } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { PermissionItem } from '../types'
import PermissionModal from './PermissionModal'
import { AppDispatch } from '@/store/store'
import { addPermission, deletePermission, fetchPermissions, updatePermission } from '../rolePermissionSlice'

const PermissionManagement = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions, loading } = useSelector((state: RootState) => state.rolePermission)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PermissionItem | null>(null)

  useEffect(() => {
    dispatch(fetchPermissions())
  }, [dispatch])

  const handleSubmit = (data: PermissionItem) => {
    if (editing) {
      dispatch(updatePermission(data))
    } else {
      dispatch(addPermission(data))
    }
    setModalOpen(false)
  }

  const handleDelete = (item: PermissionItem) => {
    dispatch(deletePermission(item))
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Permission Management</h2>
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
        rowKey="key"
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
                  onClick={() => {
                    setEditing(record)
                    setModalOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Popconfirm title="Delete this permission?" onConfirm={() => handleDelete(record)}>
                  <Button danger>Delete</Button>
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
