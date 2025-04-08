import React, { useEffect, useState } from 'react'
import { Table, Select, Button, Input, Popconfirm, Space } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { deleteUserRole, fetchRolePermissions, fetchUserRoles, updateUserRole } from '../rolePermissionSlice'
import { useNotification } from '@/hooks/useNotification'
import { CheckOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'

const UserRoleManagement = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { userRoles, rolePermissions } = useSelector((state: RootState) => state.rolePermission)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [editingUserName, setEditingUserName] = useState<string>('')

  const { showNotification } = useNotification()

  useEffect(() => {
    dispatch(fetchUserRoles())
    dispatch(fetchRolePermissions(''))
  }, [dispatch])

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    setSelectedRole(record.role)
    setEditingUserName(record.userName)
  }
  const handleRemove = async (record: any) => {
    if (!record.id) return
    await dispatch(deleteUserRole([record.id]))
    dispatch(fetchUserRoles())
  }

  const handleSave = async (record: any) => {
    const params = {
      id: record.id,
      userId: record.userId,
      role: selectedRole,
      userName: editingUserName,
    }

    dispatch(updateUserRole(params))
      .unwrap()
      .then(res => {
        if (res) {
          showNotification('success', 'update successfully', 'message')
          dispatch(fetchUserRoles())
        } else {
          showNotification('error', 'update faild', 'message')
        }
        setEditingId(null)
      })
  }

  const columns = [
    {
      title: 'User Role Id',
      dataIndex: 'id',
    },
    {
      title: 'User Id',
      dataIndex: 'userId',
    },
    {
      title: 'User Name',
      dataIndex: 'userName',
      render: (_: any, record: any) => {
        if (record.id === editingId) {
          return (
            <Input value={editingUserName} onChange={e => setEditingUserName(e.target.value)} style={{ width: 160 }} />
          )
        }
        return record.userName
      },
    },
    {
      title: 'Org Name',
      dataIndex: 'orgName',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (_: any, record: any) => {
        if (record.id === editingId) {
          return (
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: 160 }}
              options={rolePermissions.map(r => ({ label: r.role, value: r.role }))}
            />
          )
        }
        return record.role
      },
    },
    {
      title: 'Actions',
      render: (_: any, record: any) => {
        if (record.id === editingId) {
          return (
            <Popconfirm title="Confirm delete?" onConfirm={() => handleSave(record)}>
              <Button type="text" icon={<CheckOutlined />} color="primary" />
            </Popconfirm>
          )
        }
        return (
          <Space>
            <Button type="text" onClick={() => handleEdit(record)} icon={<EditOutlined />} />
            <Popconfirm title="Confirm delete?" onConfirm={() => handleRemove(record)}>
              <Button type="text" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">User Role Management</h2>
      <Table rowKey="id" columns={columns} dataSource={userRoles} />
    </div>
  )
}

export default UserRoleManagement
