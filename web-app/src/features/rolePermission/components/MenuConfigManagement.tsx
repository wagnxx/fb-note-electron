import React, { useEffect, useState } from 'react'
import { Tree, Button, Modal, Input, Select, Tooltip, Popconfirm, Form } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { addMenuItem, deleteMenuItem, fetchMenuItems, fetchPermissions, updateMenuItem } from '../rolePermissionSlice'
import { MenuItem } from '../types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { Optional } from '@/utils/types'

const MenuConfigManagement: React.FC = () => {
  const dispatch = useAppDispatch()
  const menuItems = useAppSelector(state => state.rolePermission.menuItems)
  const allPermissions = useAppSelector(state => state.rolePermission.permissions)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Optional<MenuItem, 'id'> | null>(null)

  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  const [form] = Form.useForm()

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPermissions())
      dispatch(fetchMenuItems())
    }
  }, [dispatch, isAuthenticated])

  const openEdit = (item: Optional<MenuItem, 'id'>) => {
    setEditingItem(item)
    form.setFieldsValue(item)
    setModalOpen(true)
  }

  const handleAddChild = (parentId: string | null) => {
    const newItem: Optional<MenuItem, 'id'> = {
      label: '',
      key: '',
      permissions: [],
      parentId,
      order: 0,
    }
    setEditingItem(newItem)
    form.setFieldsValue(newItem)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    await dispatch(deleteMenuItem([id]))
    dispatch(fetchMenuItems())
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      const item = { ...editingItem, ...values } as MenuItem
      console.log('handle ok: ', item)
      if (item.id) {
        dispatch(updateMenuItem(item))
          .unwrap()
          .then(res => {
            if (res) {
              dispatch(fetchMenuItems())
            }
          })
      } else {
        dispatch(addMenuItem(item))
          .unwrap()
          .then(res => {
            if (res) {
              dispatch(fetchMenuItems())
            }
          })
      }
      setModalOpen(false)
    })
  }

  const buildTree = (items: MenuItem[], parentId: string | null = null): any[] => {
    return items
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        key: item.id,
        title: (
          <div className="flex justify-between items-center group">
            <span onClick={() => openEdit(item)} className="cursor-pointer hover:text-blue-500">
              {item.label}
            </span>
            <div className="ml-3 flex gap-1   group-hover:opacity-100  opacity-0">
              <Tooltip title="Add Child">
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={e => {
                    e.stopPropagation()
                    handleAddChild(item.id)
                  }}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Popconfirm
                  title="Are you sure to delete this menu?"
                  onConfirm={e => {
                    e?.stopPropagation()
                    handleDelete(item.id)
                  }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={e => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tooltip>
            </div>
          </div>
        ),
        children: buildTree(items, item.id),
      }))
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Menu Config Management</h2>
        <Button type="primary" onClick={() => handleAddChild(null)}>
          Add Root Menu
        </Button>
      </div>

      <Tree treeData={buildTree(menuItems)} defaultExpandAll />

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleOk} title="Edit Menu">
        <Form form={form} layout="vertical">
          {editingItem?.parentId && (
            <Form.Item label="Parent ID">
              <Input value={editingItem.parentId} disabled />
            </Form.Item>
          )}
          <Form.Item label="Label" name="label" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Key" name="key" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Order" name="order" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Permissions" name="permissions" rules={[{ required: true }]}>
            <Select mode="multiple" options={allPermissions.map(p => ({ label: p.key, value: p.key }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MenuConfigManagement
