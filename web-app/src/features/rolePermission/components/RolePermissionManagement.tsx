import React, { useEffect, useState } from 'react'
import { Table, Button, Tag, Popconfirm } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { RolePermission } from '../types'
import RolePermissionModal from './RolePermissionModal'
import { createRole, fetchPermissions, fetchRolePermissions, modifyRole, removeRole } from '../rolePermissionSlice'

const RolePermissionManagement = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions, rolePermissions, loading } = useSelector((state: RootState) => state.rolePermission)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null)

  useEffect(() => {
    dispatch(fetchPermissions())
    dispatch(fetchRolePermissions('org_abc'))
  }, [dispatch])

  const openAdd = () => {
    setEditingRole(null)
    setModalOpen(true)
  }

  const openEdit = (record: RolePermission) => {
    setEditingRole(record)
    setModalOpen(true)
  }

  const handleDelete = (record: RolePermission) => {
    const ids = [record.id]
    dispatch(removeRole(ids))
      .unwrap()
      .then(res => {
        if (res) {
          dispatch(fetchRolePermissions('org_abc'))
        }
      })
  }

  const handleSubmit = (data: RolePermission) => {
    if (editingRole) {
      dispatch(modifyRole(data))
        .unwrap()
        .then(res => {
          if (res) {
            dispatch(fetchRolePermissions('org_abc'))
          }
        })
    } else {
      dispatch(createRole(data))
        .unwrap()
        .then(res => {
          if (res) {
            dispatch(fetchRolePermissions('org_abc'))
          }
        })
    }
    setModalOpen(false)
  }

  const columns = [
    {
      title: 'Role',
      dataIndex: 'role',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      render: (keys: string[]) =>
        keys.includes('*') ? (
          <Tag color="red">All (*)</Tag>
        ) : (
          keys.map(key => {
            const desc = permissions.find(p => p.key === key)?.desc_en || key
            return <Tag key={key}>{desc}</Tag>
          })
        ),
    },
    {
      title: 'Actions',
      render: (_: any, record: RolePermission) => (
        <div className="flex gap-2">
          <Button onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Confirm delete?" onConfirm={() => handleDelete(record)}>
            <Button danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Role-Permission Management</h1>
        <Button type="primary" onClick={openAdd}>
          Add Role
        </Button>
      </div>
      <Table columns={columns} dataSource={rolePermissions} rowKey="role" loading={loading} />
      <RolePermissionModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        permissionOptions={permissions}
        defaultData={editingRole}
      />
    </div>
  )
}

export default RolePermissionManagement
