import React, { useEffect, useState } from 'react'
import { Tree, Button, Modal, Input, Select, Tooltip, Popconfirm, Form } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  addMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  fetchPermissions,
  updateMenuItem,
} from '../slices/rolePermissionSlice'
import { SystemMenuItem as MenuItem } from '../types'
import { Optional, PartialWithRequiredId } from '@/utils/types'
import { AsyncThunkAction } from '@reduxjs/toolkit'

const MenuConfigManagement: React.FC = () => {
  const dispatch = useAppDispatch()
  const menuItems = useAppSelector(state => state.rolePermission.menuItems)
  const allPermissions = useAppSelector(state => state.rolePermission.permissions)
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Optional<MenuItem, 'id'> | null>(null)
  const [parentLabel, setParentLabel] = useState<string | null>(null)

  const [form] = Form.useForm()

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPermissions())
      dispatch(fetchMenuItems())
    }
  }, [dispatch, isAuthenticated])

  const openEdit = (item: Optional<MenuItem, 'id'>) => {
    setEditingItem(item)
    setParentLabel(getParentLabel(item.parentId))
    form.setFieldsValue(item)
    setModalOpen(true)
  }

  const handleAddChild = (parentId: string | null) => {
    const parent = menuItems.find(i => i.id === parentId)
    const newItem: Optional<MenuItem, 'id'> = {
      label: '',
      key: '',
      order: 0,
      permissions: [],
      parentId,
    }
    setEditingItem(newItem)
    setParentLabel(parent?.label ?? null)
    form.setFieldsValue(newItem)
    setModalOpen(true)
  }
  const handleDelete = async (id: string) => {
    await dispatch(deleteMenuItem([id])) // 执行删除操作
    dispatch(fetchMenuItems()) // 删除成功后刷新菜单列表
  }
  const handleOk = () => {
    form.validateFields().then(values => {
      // 合并编辑项和表单值，确保类型为 MenuItem
      const item = { ...editingItem, ...values } as MenuItem

      // 根据 item 是否有 id 来选择对应的 action
      const action = item.id ? updateMenuItem : addMenuItem

      // 动态推导出正确的类型
      const typedItem = item.id ? (item as PartialWithRequiredId<MenuItem, 'id'>) : (item as Optional<MenuItem, 'id'>)

      // 确保传递给 dispatch 的 action 类型正确
      dispatch(action(typedItem as any) as AsyncThunkAction<any, any, any>)
        .unwrap()
        .then(() => dispatch(fetchMenuItems())) // 操作成功后刷新数据
        .finally(() => setModalOpen(false)) // 确保关闭 Modal
    })
  }

  const getParentLabel = (parentId: string | null) => {
    return parentId ? (menuItems.find(item => item.id === parentId)?.label ?? '') : ''
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
            <div className="ml-3 flex gap-1 group-hover:opacity-100 opacity-0">
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
          {parentLabel && (
            <Form.Item label="Parent Menu">
              <Input value={parentLabel} disabled />
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
          <Form.Item label="Permissions" name="permissions">
            <Select mode="multiple" options={allPermissions.map(p => ({ label: p.key, value: p.key }))} allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MenuConfigManagement
